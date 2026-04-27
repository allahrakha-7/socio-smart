import mongoose from 'mongoose';

const rosterSchema = new mongoose.Schema(
  {
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'staffType',
      required: true,
    },
    staffType: {
      type: String,
      required: true,
      enum: ['Staff', 'Guard'],
      default: 'Staff',
    },
    day: {
      type: String,
      required: true,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    },
    shift_start: {
      type: String,
      required: true,
      default: '09:00 AM',
    },
    shift_end: {
      type: String,
      required: true,
      default: '06:00 PM',
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    task: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  { timestamps: true }
);

const Roster = mongoose.model('Roster', rosterSchema);

export default Roster;
