import mongoose from 'mongoose';

const gateActivitySchema = new mongoose.Schema({
  plate_number: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['GRANTED', 'DENIED'],
    required: true
  },
  reason: {
    type: String
  },
  owner_name: {
    type: String
  },
  unit: {
    type: String
  },
  vehicle_details: {
    type: String
  },
  is_manual_override: {
    type: Boolean,
    default: false
  },
  guard: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Guard'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const GateActivity = mongoose.model('GateActivity', gateActivitySchema);

export default GateActivity;
