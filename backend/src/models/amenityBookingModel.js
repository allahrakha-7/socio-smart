import mongoose from 'mongoose';

const amenityBookingSchema = new mongoose.Schema(
  {
    resident: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resident',
      required: true,
    },
    amenity: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Amenity',
      required: true,
    },
    bookingDate: {
      type: Date,
      required: true,
    },
    slot: {
      type: String, // e.g. "06:00 PM - 08:00 PM"
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
    },
    purpose: {
      type: String,
    },
    adminNotes: {
      type: String,
    }
  },
  { timestamps: true }
);

const AmenityBooking = mongoose.model('AmenityBooking', amenityBookingSchema);

export default AmenityBooking;
