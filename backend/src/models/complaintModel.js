import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema(
  {
    resident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resident',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      default: 'General',
    },
    amenity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Amenity',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'resolved'],
      default: 'pending',
    },
    isUrgent: {
      type: Boolean,
      default: false,
    },
    requestLevel: {
      type: String,
      enum: ['Unit Level', 'Community Level'],
      default: 'Unit Level',
    },
    image: {
      type: String, // Base64 or URL
      default: '',
    },
    adminNotes: {
      type: String,
      default: '',
    },
    resolvedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

const Complaint = mongoose.model('Complaint', complaintSchema);

export default Complaint;
