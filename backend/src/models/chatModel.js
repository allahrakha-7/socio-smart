import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: 'senderType',
    },
    senderType: {
      type: String,
      required: true,
      enum: ['Resident', 'Admin', 'Guard'],
    },
    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'receiverType',
    },
    receiverType: {
      type: String,
      enum: ['Resident', 'Admin', 'Guard'],
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'file'],
      default: 'text',
    },
    image: String,
    file: {
      name: String,
      url: String,
      fileType: String
    },
    isPrivate: {
      type: Boolean,
      default: false
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedFor: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User' // Using a generic ref or just the ID is fine
    }]
  },
  { timestamps: true }
);

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;
