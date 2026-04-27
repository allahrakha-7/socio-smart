import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Security', 'Emergency', 'Fire', 'Medical', 'SOS'],
      default: 'Security',
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'senderModel',
      required: true,
    },
    senderModel: {
      type: String,
      required: true,
      enum: ['Resident', 'Guard'],
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    location: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'resolved'],
      default: 'active',
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    resolvedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Alert = mongoose.model('Alert', alertSchema);

export default Alert;
