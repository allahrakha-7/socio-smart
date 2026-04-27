import mongoose from 'mongoose';

const communicationSchema = new mongoose.Schema({
  resident: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resident',
    required: true,
  },
  guard: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Guard',
  },
  type: {
    type: String,
    enum: ['Standard', 'Urgent', 'Emergency'],
    default: 'Standard',
  },
  subject: {
    type: String,
    default: 'Resident Query',
  },
  status: {
    type: String,
    enum: ['pending', 'ringing', 'handled', 'missed'],
    default: 'pending',
  },
  house_number: {
    type: String,
    required: true,
  },
  resident_name: {
    type: String,
    required: true,
  },
  startTime: {
    type: Date,
    default: Date.now,
  },
  endTime: {
    type: Date,
  },
  duration: {
    type: Number, // in seconds
  }
}, { timestamps: true });

const Communication = mongoose.model('Communication', communicationSchema);
export default Communication;
