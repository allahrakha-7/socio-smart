import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const guardSchema = mongoose.Schema(
    {
        full_name: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            // Logic: Must end with @staff.sociosmart.com
            match: [/^\w+([\.-]?\w+)*@staff\.sociosmart\.com$/, 'Please use a valid staff email address'],
        },
        password: {
            type: String,
            required: true,
            select: false, // Don't return password by default
        },
        phone: {
            type: String,
            required: true,
        },
        // Shifting time as per Section 4.3.1 of documentation
        shifting_time: {
            type: String,
            required: true,
            default: '08:00 AM - 08:00 PM', // Example: Day shift
        },
        status: {
            type: String,
            enum: ['active', 'inactive', 'on-leave'],
            default: 'active',
        },
        assigned_gate: {
            type: String,
            default: 'Main Gate',
        },
        resetPasswordToken: String,
        resetPasswordExpires: Date,
        biometricPublicKey: String,
        profile_image: {
            type: String,
            default: 'https://res.cloudinary.com/dku9p6pzn/image/upload/v1713210000/default_avatar.png'
        },
    },
    {
        timestamps: true,
    }
);

// Method to verify password for login
guardSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Middleware to hash password before saving
guardSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

const Guard = mongoose.model('Guard', guardSchema);

export default Guard;
