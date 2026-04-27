import mongoose from 'mongoose';

const postSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resident',
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['text', 'image', 'poll', 'event', 'file'],
      default: 'text'
    },
    image: {
      type: String, // URL to image
    },
    poll: {
      question: String,
      options: [
        {
          text: String,
          votes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Resident' }]
        }
      ]
    },
    event: {
      title: String,
      date: Date,
      location: String,
      description: String
    },
    file: {
      name: String,
      url: String,
      fileType: String
    },
    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Resident',
      },
    ],
    comments: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident' },
        text: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],
    shares: {
      type: Number,
      default: 0
    },
  },
  { timestamps: true }
);

const Post = mongoose.model('Post', postSchema);

export default Post;
