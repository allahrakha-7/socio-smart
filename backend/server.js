import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer } from 'http';
import { Server } from 'socket.io';

import connectDB from './src/config/db.js';

import authRoutes from './src/routes/authRoutes.js';
import noticeRoutes from './src/routes/noticeRoutes.js';
import vehicleRoutes from './src/routes/vehicleRoutes.js';
import complaintRoutes from './src/routes/complaintRoutes.js';
import gateRoutes from './src/routes/gateRoutes.js';
import alertRoutes from './src/routes/alertRoutes.js';
import staffRoutes from './src/routes/staffRoutes.js';
import rosterRoutes from './src/routes/rosterRoutes.js';
import reportRoutes from './src/routes/reportRoutes.js';
import paymentRoutes from './src/routes/paymentRoutes.js';
import amenityRoutes from './src/routes/amenityRoutes.js';
import communityRoutes from './src/routes/communityRoutes.js';
import visitorRoutes from './src/routes/visitorRoutes.js';
import commRoutes from './src/routes/communicationRoutes.js';
import announcementRoutes from './src/routes/announcementRoutes.js';
import notificationRoutes from './src/routes/notificationRoutes.js';
import { notFound, errorHandler } from './src/middlewares/errorMiddleware.js';
import jwt from 'jsonwebtoken';

import Chat from './src/models/chatModel.js';
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

connectDB();

const app = express();
app.disable('etag');
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// --- socket.io Logic ---
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded; // { id, role }
    next();
  } catch (err) {
    return next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id, 'Authenticated User ID:', socket.user.id);

  // Automatically and securely join the user's private room
  socket.join(`user_${socket.user.id}`);
  console.log(`[Socket] User ${socket.user.id} joined their secure private room`);

  socket.on('join_community', () => {
    socket.join('community_group');
  });

  socket.on('send_message', async (data) => {
    console.log('[Socket] send_message received');
    try {
      // Force sender to be the authenticated user for security
      const sender = socket.user.id;
      const { senderType, receiver, receiverType, content, type, image, file, isPrivate } = data;

      const validRoles = ['Resident', 'Admin', 'Guard'];
      if (!validRoles.includes(senderType)) {
        console.error('[Socket] Invalid senderType:', senderType);
        return;
      }
      if (isPrivate && !validRoles.includes(receiverType)) {
        console.error('[Socket] Invalid receiverType:', receiverType);
        return;
      }

      let imageUrl = image;
      if (image && image.startsWith('data:image')) {
        const uploadRes = await cloudinary.uploader.upload(image, {
          folder: 'Chat_Images',
        });
        imageUrl = uploadRes.secure_url;
      }

      let fileData = file;
      if (file && file.url && file.url.startsWith('data:')) {
        const uploadRes = await cloudinary.uploader.upload(file.url, {
          folder: 'Chat_Files',
          resource_type: 'raw',
        });
        fileData = { ...file, url: uploadRes.secure_url };
      }

      const newMessage = await Chat.create({
        sender,
        senderType,
        receiver,
        receiverType,
        content,
        type: type || 'text',
        image: imageUrl,
        file: fileData,
        isPrivate: !!isPrivate
      });

      const populatedMessage = await Chat.findById(newMessage._id)
        .populate('sender', 'full_name house_number profile_image')
        .populate('receiver', 'full_name house_number profile_image');

      if (isPrivate && receiver) {
        console.log(`[Socket] Routing PRIVATE message from ${sender} to ${receiver}`);
        console.log(`[Socket] Emitting to rooms: user_${receiver} and user_${sender}`);
        io.to(`user_${receiver}`).to(`user_${sender}`).emit('receive_message', populatedMessage);
      } else {
        console.log('[Socket] Broadcasting PUBLIC message to community_group...');
        io.to('community_group').emit('receive_message', populatedMessage);
      }
    } catch (error) {
      console.error('[Socket] Message Error:', error);
    }
  });

  socket.on('delete_message', async ({ messageId, userId, deleteForEveryone }) => {
    console.log('[Socket] delete_message received:', { messageId, userId, deleteForEveryone });
    try {
      const chat = await Chat.findById(messageId);
      if (!chat) return;

      if (deleteForEveryone) {
        // Only sender can delete for everyone
        if (chat.sender.toString() === userId) {
          chat.isDeleted = true;
          chat.content = 'This message was deleted';
          chat.image = null;
          chat.file = null;
          await chat.save();

          // Notify relevant rooms
          const rooms = chat.isPrivate ? [`user_${chat.sender}`, `user_${chat.receiver}`] : ['community_group'];
          io.to(rooms).emit('message_deleted', { messageId, isDeleted: true, content: chat.content });
        }
      } else {
        // Delete for me
        if (!chat.deletedFor.includes(userId)) {
          chat.deletedFor.push(userId);
          await chat.save();
        }
        // Notify the user who deleted so they can update local state
        socket.emit('message_deleted', { messageId, isDeletedForMe: true });
      }
    } catch (e) {
      console.error('[Socket] Delete Error:', e);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// --- GLOBAL MIDDLEWARES ---
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('dev'));

// Provide io instance to routes if needed
app.set('io', io);

// --- API ROUTES ---
app.use('/api/auth', authRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/gate', gateRoutes);
app.use('/api/alerts', alertRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/rosters', rosterRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/amenities', amenityRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/visitors', visitorRoutes);
app.use('/api/communications', commRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/notifications', notificationRoutes);

app.get('/', (req, res) => {
  res.send('SocioSmart API + Real-time Socket Store is running! 🚀');
});

// --- GLOBAL ERROR HANDLING ---
app.use(notFound);
app.use(errorHandler);

const port = process.env.PORT || 5000;
httpServer.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
