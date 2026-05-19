import { v2 as cloudinary } from 'cloudinary';
import Post from '../models/postModel.js';
import Chat from '../models/chatModel.js';
import Resident from '../models/residentModel.js';

// @desc    Get all community posts
// @route   GET /api/community/posts
export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', 'full_name house_number role profile_image')
      .populate('comments.user', 'full_name profile_image')
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching posts' });
  }
};

export const createPost = async (req, res) => {
  try {
    const { content, image, type, poll, event, file } = req.body;
    
    let imageUrl = image;
    if (image && image.startsWith('data:image')) {
      const uploadRes = await cloudinary.uploader.upload(image, {
        folder: 'Community_Posts',
      });
      imageUrl = uploadRes.secure_url;
    }

    let fileData = file;
    if (file && file.url && file.url.startsWith('data:')) {
      const uploadRes = await cloudinary.uploader.upload(file.url, {
        folder: 'Community_Files',
        resource_type: 'raw',
      });
      fileData = { ...file, url: uploadRes.secure_url };
    }

    const post = await Post.create({
      user: req.user.id,
      content,
      image: imageUrl,
      type: type || 'text',
      poll,
      event,
      file: fileData
    });
    const populated = await Post.findById(post._id)
      .populate('user', 'full_name house_number role profile_image');
    
    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('receive_new_post', populated);
    }

    res.status(201).json(populated);
  } catch (error) {
    console.error('[Cloudinary Upload Error]:', error);
    res.status(500).json({ message: 'Error creating post with image' });
  }
};

// @desc    Edit a post
// @route   PUT /api/community/posts/:id
export const editPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });
    
    // Check if user is the owner
    if (post.user.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized to edit this post' });
    }

    // Check 5 min timeframe
    const timeDiff = new Date() - new Date(post.createdAt);
    if (timeDiff > 5 * 60 * 1000) {
      return res.status(400).json({ message: 'Post can only be edited within 5 minutes of creation' });
    }

    post.content = req.body.content || post.content;

    if (req.body.image && req.body.image.startsWith('data:image')) {
      const uploadRes = await cloudinary.uploader.upload(req.body.image, {
        folder: 'Community_Posts',
      });
      post.image = uploadRes.secure_url;
    }

    if (req.body.file && req.body.file.url && req.body.file.url.startsWith('data:')) {
      const uploadRes = await cloudinary.uploader.upload(req.body.file.url, {
        folder: 'Community_Files',
        resource_type: 'raw',
      });
      post.file = { ...req.body.file, url: uploadRes.secure_url };
    }

    await post.save();

    const populated = await Post.findById(post._id)
      .populate('user', 'full_name house_number role profile_image')
      .populate('comments.user', 'full_name profile_image');
    
    const io = req.app.get('io');
    if (io) io.emit('receive_post_update', populated);

    res.json(populated);
  } catch (error) {
    console.error('[Cloudinary Edit Error]:', error);
    res.status(500).json({ message: 'Error editing post' });
  }
};

// @desc    Delete a post
// @route   DELETE /api/community/posts/:id
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    // Allow deleting if owner or admin
    if (post.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to delete this post' });
    }

    await post.deleteOne();

    const io = req.app.get('io');
    if (io) io.emit('receive_post_delete', req.params.id);

    res.json({ message: 'Post removed' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error deleting post' });
  }
};

// @desc    Vote on a poll
// @route   PATCH /api/community/posts/:id/vote
export const votePoll = async (req, res) => {
  try {
    const { optionId } = req.body;
    const post = await Post.findById(req.params.id);

    if (!post || post.type !== 'poll') {
      return res.status(404).json({ message: 'Poll not found' });
    }

    // Remove user's previous votes in this poll
    post.poll.options.forEach(opt => {
      const idx = opt.votes.indexOf(req.user.id);
      if (idx !== -1) opt.votes.splice(idx, 1);
    });

    // Add vote to new option
    const option = post.poll.options.id(optionId);
    if (option) {
      option.votes.push(req.user.id);
    }

    await post.save();
    const populated = await Post.findById(post._id)
      .populate('user', 'full_name house_number role profile_image')
      .populate('comments.user', 'full_name profile_image');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Error voting on poll' });
  }
};

// @desc    Get chat history
// @route   GET /api/community/chats
export const getChats = async (req, res) => {
  try {
    // Strictly filter to ONLY show private chats where user is sender or receiver (like WhatsApp)
    const chats = await Chat.find({
      $or: [
        { sender: req.user.id },
        { receiver: req.user.id }
      ]
    })
      .populate('sender', 'full_name house_number profile_image')
      .populate('receiver', 'full_name house_number profile_image')
      .sort({ createdAt: 1 })
      .limit(100);
    res.json(chats);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching chat history' });
  }
};

// @desc    Get all residents for contact list
export const getResidents = async (req, res) => {
  try {
    const residents = await Resident.find()
      .select('full_name house_number block phone profile_image blood_group emergency_contact bio')
      .sort({ block: 1, house_number: 1 });
    console.log('[API] Residents Directory: Fetched', residents.length, 'total residents.');
    res.json(residents);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching residents' });
  }
};

// @desc    Toggle like on post
// @route   PATCH /api/community/posts/:id/like
export const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const index = post.likes.indexOf(req.user.id);
    if (index === -1) {
      post.likes.push(req.user.id);
    } else {
      post.likes.splice(index, 1);
    }

    await post.save();

    const populated = await Post.findById(post._id)
      .populate('user', 'full_name house_number role profile_image')
      .populate('comments.user', 'full_name profile_image');

    // Emit real-time update for like
    const io = req.app.get('io');
    if (io) {
      io.emit('receive_post_update', populated);
    }

    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Error liking post' });
  }
};

// @desc    Add comment to post
// @route   POST /api/community/posts/:id/comments
export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const newComment = {
      user: req.user.id,
      text,
      createdAt: new Date()
    };

    post.comments.push(newComment);
    await post.save();

    const populated = await Post.findById(post._id)
      .populate('user', 'full_name house_number role profile_image')
      .populate('comments.user', 'full_name profile_image');

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('receive_post_update', populated);
    }

    res.status(201).json(populated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error adding comment' });
  }
};

// @desc    Increment share count on post
// @route   PATCH /api/community/posts/:id/share
export const sharePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.shares = (post.shares || 0) + 1;
    await post.save();

    // Emit real-time update
    const io = req.app.get('io');
    if (io) {
      io.emit('receive_post_update', post);
    }

    res.json(post);
  } catch (error) {
    res.status(500).json({ message: 'Error sharing post' });
  }
};
