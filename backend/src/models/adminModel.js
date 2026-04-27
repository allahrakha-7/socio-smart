import mongoose from "mongoose";
import bcrypt from "bcryptjs"; // <-- Make sure to run: npm install bcryptjs

const adminSchema = new mongoose.Schema(
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
            required: [true, "Phone number is required"],
        },
        status: {
            type: String,
            enum: ["active", "suspended"],
            default: "active",
        },
        resetPasswordToken: String,
        resetPasswordExpires: Date,
        biometricPublicKey: String,
        profile_image: {
            type: String,
            default: 'https://res.cloudinary.com/dku9p6pzn/image/upload/v1713210000/default_avatar.png'
        },
    },
    { timestamps: true }
);

adminSchema.pre("save", async function () {
    // If the user is just updating their phone number, don't re-hash the password!
    if (!this.isModified("password")) {
        return; // Just return to exit the function early
    }

    // Scramble the password securely
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// --- HELPER METHOD: Check if entered password matches the hashed one ---
adminSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

export default mongoose.model("Admin", adminSchema);
