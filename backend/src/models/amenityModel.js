import mongoose from 'mongoose';

const amenitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String, // URL or base64
    },
    price: {
      type: String,
      default: 'Free',
    },
    icon: {
      type: String, // lucide icon name or image URL
      default: 'Box',
    },
    location: {
      type: String,
      default: 'Main Campus',
    },
    timings: {
      open: { type: String, default: '06:00 AM' },
      close: { type: String, default: '10:00 PM' },
    },
    rules: [{
      type: String
    }],
    isMaintenance: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['available', 'closed', 'maintenance'],
      default: 'available'
    }
  },
  { timestamps: true }
);

const Amenity = mongoose.model('Amenity', amenitySchema);

export default Amenity;
