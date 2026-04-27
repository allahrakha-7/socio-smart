import mongoose from "mongoose";
import bcrypt from "bcryptjs"; // <-- Make sure to run: npm install bcryptjs

const residentSchema = new mongoose.Schema(
  {
    full_name: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Brilliant choice keeping this!
    },
    phone: {
      type: String,
      required: [false, "Phone number is required"],
    },
    house_number: {
      type: String,
      // Not required for admins/guards, so we remove the strict 'required' array
      default: "",
    },
    block: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["pending", "active", "revoked"],
      default: "pending", // All new signups must be explicitly approved by an admin
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    biometricPublicKey: String,
    profile_image: {
      type: String,
      default: 'https://res.cloudinary.com/dku9p6pzn/image/upload/v1713210000/default_avatar.png'
    },
    bio: {
      type: String,
      default: ''
    },
    blood_group: {
      type: String,
      enum: ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      default: ''
    },
    emergency_contact: {
      type: String,
      default: ''
    },
    family_members: [{
      name: { type: String, default: '' },
      relation: { type: String, default: '' }
    }],
    vehicles: [{
      vehicle_no: { type: String, default: '' },
      model: { type: String, default: '' },
      color: { type: String, default: '' },
      type: { type: String, enum: ['car', 'bike', 'other'], default: 'car' },
      parking_slot: { type: String, default: '' },
      image: { type: String, default: '' }
    }],
    pets: [{
      name: { type: String, default: '' },
      type: { type: String, default: '' }
    }]
  },
  { timestamps: true }
);

residentSchema.pre("save", async function () {
  // If the user is just updating their phone number, don't re-hash the password!
  if (!this.isModified("password")) {
    return; // Just return to exit the function early
  }

  // Scramble the password securely
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// --- HELPER METHOD: Check if entered password matches the hashed one ---
residentSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("Resident", residentSchema);
