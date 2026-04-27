import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'ownerModel',
      required: true,
    },
    ownerModel: {
      type: String,
      required: true,
      enum: ['Resident', 'Admin'],
      default: 'Resident',
    },
    vehicle_number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    vehicle_type: {
      type: String,
      enum: ['car', 'bike', 'other'],
      required: true,
    },
    make_model: {
      type: String,
      required: true,
      trim: true,
    },
    color: {
      type: String,
      required: true,
      trim: true,
    },
    approval_status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    status: {
      type: String,
      enum: ['active', 'blacklisted', 'inactive'],
      default: 'active',
    },
    rfid_tag: {
      type: String,
      unique: true,
      sparse: true,
    },
    parking_slot: {
      type: String,
      required: true,
      trim: true,
    },
    vehicle_image: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

export default Vehicle;
