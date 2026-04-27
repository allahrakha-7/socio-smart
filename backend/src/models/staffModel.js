import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema(
  {
    full_name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['Security', 'Maintenance', 'Electrician', 'Plumber', 'Cleaner', 'Manager', 'Gardener', 'Housekeeping'],
      default: 'Maintenance',
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['online', 'offline', 'on-leave'],
      default: 'online',
    },
    shift: {
      type: String,
      default: '09:00 AM - 06:00 PM',
    },
    rating: {
      type: Number,
      default: 4.5,
    },
    last_active: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Staff = mongoose.model('Staff', staffSchema);

export default Staff;
