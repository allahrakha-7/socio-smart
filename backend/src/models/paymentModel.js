import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    resident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resident',
      required: true,
    },
    house_number: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true, // e.g., "Monthly Maintenance", "Water Charges"
    },
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['paid', 'due', 'overdue', 'pending'],
      default: 'due',
    },
    type: {
      type: String,
      enum: ['Maintenance', 'Utility', 'Surcharge', 'Special'],
      default: 'Maintenance',
    },
    dueDate: {
      type: Date,
    },
    breakdown: [{
      label: String,
      amount: Number
    }],
    month: {
      type: String,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    paidAt: {
      type: Date,
    },
    receiptId: {
      type: String,
      unique: true,
      sparse: true
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'Bank Transfer', 'Credit Card', 'Online', 'None'],
      default: 'None',
    }
  },
  { timestamps: true }
);

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
