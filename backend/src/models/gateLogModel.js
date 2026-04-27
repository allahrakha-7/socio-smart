import mongoose from 'mongoose';

const gateLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Visitor', 'Resident', 'Staff', 'Delivery', 'Cab'],
      default: 'Visitor',
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    vehicle_number: {
      type: String,
      trim: true,
      uppercase: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    purpose: {
      type: String,
      trim: true,
    },
    unit_to_visit: {
      type: String,
      trim: true,
    },
    gate: {
      type: String,
      default: 'Main Gate',
    },
    guard: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Guard',
    },
    status: {
      type: String,
      enum: ['inside', 'exited', 'denied'],
      default: 'inside',
    },
    entry_time: {
      type: Date,
      default: Date.now,
    },
    exit_time: {
      type: Date,
    },
    is_manual_override: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const GateLog = mongoose.model('GateLog', gateLogSchema);

export default GateLog;
