import mongoose from 'mongoose';

const visitorSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['Visitor', 'Delivery', 'Cab', 'Others'],
      default: 'Visitor',
    },
    expected_date: {
      type: Date,
      required: true,
    },
    plate_number: {
      type: String, // E.g. LEA-1234
      uppercase: true,
      trim: true,
    },
    resident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resident',
      required: true,
    },
    house_number: {
      type: String,
      required: true,
    },
    pass_code: {
      type: String,
      unique: true,
      required: false, // Optional for ad-hoc
    },
    is_ad_hoc: {
      type: Boolean,
      default: false,
    },
    approval_status: {
      type: String,
      enum: ['none', 'requested', 'approved', 'denied'],
      default: 'none',
    },
    handled_at: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['pending', 'arrived', 'cancelled', 'expired'],
      default: 'pending',
    },
  },
  { timestamps: true }
);

const Visitor = mongoose.model('Visitor', visitorSchema);

export default Visitor;
