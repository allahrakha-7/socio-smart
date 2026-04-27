import Admin from '../models/adminModel.js';
import Resident from '../models/residentModel.js';
import Guard from '../models/guardModel.js';
import generateToken from '../utils/generateToken.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

import dotenv from 'dotenv';
dotenv.config();

// --- CONFIGURATION ---
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const GUARD_PASSWORD = process.env.GUARD_PASSWORD;

const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.log("Transporter Error: ", error.message);
  } else {
    console.log("Email server is ready to take our messages");
  }
});

// --- CONTROLLERS ---

/**
 * @desc    Unified Login (Admin, Guard, Resident)
 * @route   POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Please provide email and password' });

    const normalizedEmail = String(email).toLowerCase().trim();

    // 1. Try to find user in any collection first (Resident, Admin, Guard)
    let user = await Resident.findOne({ email: normalizedEmail }).select('+password');
    let role = 'resident';

    if (!user) {
      user = await Admin.findOne({ email: normalizedEmail }).select('+password');
      role = 'admin';
    }
    if (!user) {
      user = await Guard.findOne({ email: normalizedEmail }).select('+password');
      role = 'guard';
    }

    // 2. Domain-wide Master Password logic (Auto-Initialization)
    // Only if user doesn't exist yet
    if (!user) {
      if (normalizedEmail.endsWith('@staff.sociosmart.com') && password === GUARD_PASSWORD) {
        user = await Guard.create({
          full_name: normalizedEmail.split('@')[0].charAt(0).toUpperCase() + normalizedEmail.split('@')[0].slice(1),
          email: normalizedEmail,
          password: GUARD_PASSWORD,
          phone: '0000000000',
          status: 'active'
        });
        role = 'guard';
      } else if (normalizedEmail.endsWith('@sociosmart.com') && password === ADMIN_PASSWORD) {
        user = await Admin.create({
          full_name: normalizedEmail.split('@')[0].charAt(0).toUpperCase() + normalizedEmail.split('@')[0].slice(1),
          email: normalizedEmail,
          password: ADMIN_PASSWORD,
          phone: '0000000000',
          status: 'active'
        });
        role = 'admin';
      }
    }

    // 3. Final verification and token generation
    if (user && (await user.matchPassword(password))) {
      if (user.status !== 'active' && role !== 'admin') {
        return res.status(403).json({ message: 'Your account is pending admin approval. Please wait for approval.' });
      }
      
      const responseData = {
        _id: user._id,
        full_name: user.full_name,
        email: user.email,
        role: role,
        status: user.status,
        token: generateToken(user._id, role),
      };

      if (user.house_number) responseData.house_number = user.house_number;
      
      return res.status(200).json(responseData);
    }

    return res.status(401).json({ message: 'Invalid credentials or unauthorized domain.' });
  } catch (error) {
    console.error('[Login Error]:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { userId, status, role } = req.body; // role: 'resident' or 'guard'

    let user;
    if (role === 'resident') {
      user = await Resident.findByIdAndUpdate(userId, { status }, { new: true });
    } else if (role === 'guard') {
      user = await Guard.findByIdAndUpdate(userId, { status }, { new: true });
    }

    if (!user) return res.status(404).json({ message: "User not found" });

    res.status(200).json({ message: `User status updated to ${status}`, user });
  } catch (error) {
    console.error("Status Update Error:", error);
    res.status(500).json({ message: "Error updating status" });
  }
};

/**
 * @desc    Resident Self-Registration
 */
export const register = async (req, res) => {
  try {
    const { full_name, email, password } = req.body;
    if (!full_name || !email || !password) return res.status(400).json({ message: 'Missing fields' });

    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail.endsWith('@gmail.com')) return res.status(400).json({ message: 'Only @gmail.com allowed' });

    const exists = await Resident.findOne({ email: normalizedEmail });
    if (exists) return res.status(409).json({ message: 'User already exists' });

    const resident = await Resident.create({ full_name: full_name.trim(), email: normalizedEmail, password, status: 'pending' });
    res.status(201).json({
      _id: resident._id, full_name: resident.full_name, email: resident.email,
      role: 'resident', house_number: resident.house_number,
      token: generateToken(resident._id, 'resident'),
    });
  } catch (error) {
    res.status(500).json({ message: 'Registration failed' });
  }
};

/**
 * @desc    Forgot Password - Send Token
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const normalizedEmail = email.toLowerCase().trim();

    let user = await Admin.findOne({ email: normalizedEmail }) ||
      await Guard.findOne({ email: normalizedEmail }) ||
      await Resident.findOne({ email: normalizedEmail });

    if (!user) return res.status(404).json({ message: 'Email not found.' });

    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000;
    await user.save();

    const resetUrl = `sociosmart://reset-password/${token}`;

    // Send the mail
    await transporter.sendMail({
      to: user.email,
      from: `"SocioSmart Support" <${process.env.EMAIL_USER}>`,
      subject: 'Password Reset Request',
      html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2>SocioSmart Password Recovery</h2>
                    <p>Hi ${user.full_name},</p>
                    <p>Click the button below to reset your password. This link is valid for 1 hour.</p>
                    <a href="${resetUrl}" style="display:inline-block; background:#2563EB; color:white; padding:12px 24px; text-decoration:none; border-radius:100px; font-weight:bold;">RESET PASSWORD</a>
                    <p>If the button doesn't work, copy this link: ${resetUrl}</p>
                </div>`
    });

    res.status(200).json({ message: 'Reset link sent to email.' });
  } catch (error) {
    console.error('NODEMAILER ERROR:', error);
    res.status(500).json({ message: 'Email could not be sent. Please check server logs.' });
  }
};

/**
 * @desc    Reset Password - Save New Password
 */
export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;
    const query = { resetPasswordToken: token, resetPasswordExpires: { $gt: new Date() } };

    // Debug: Check if any user has this token (ignoring expiry)
    const rawCheck = await Admin.findOne({ resetPasswordToken: token }) ||
      await Guard.findOne({ resetPasswordToken: token }) ||
      await Resident.findOne({ resetPasswordToken: token });

    if (!rawCheck) {
      console.log(`[AUTH] Token "${token}" not found in database for any user.`);
    } else if (rawCheck.resetPasswordExpires < new Date()) {
      console.log(`[AUTH] Token "${token}" found but EXPIRED. Expiry: ${rawCheck.resetPasswordExpires}, Now: ${new Date()}`);
    }

    let user = await Admin.findOne(query) || await Guard.findOne(query) || await Resident.findOne(query);
    if (!user) {
      console.log(`Failed reset attempt with token: ${token} at ${new Date()}`);
      return res.status(400).json({ message: 'Invalid or expired token.' });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    const role = user.constructor.modelName.toLowerCase(); // Returns 'admin', 'guard', or 'resident'

    res.status(200).json({
      _id: user._id, full_name: user.full_name, email: user.email,
      role: role, token: generateToken(user._id, role)
    });
  } catch (error) {
    res.status(500).json({ message: 'Password reset failed.' });
  }
};


// authController.js

// Removed duplicated updateResidentStatus as we are using updateUserStatus

export const getAllUsers = async (req, res) => {
  try {
    const residents = await Resident.find({}).sort({ createdAt: -1 });
    const guards = await Guard.find({}).sort({ createdAt: -1 });

    const allUsers = [
      ...residents.map(r => ({ ...r.toObject(), type: 'resident' })),
      ...guards.map(g => ({ ...g.toObject(), type: 'guard' }))
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    res.status(200).json(allUsers);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

/**
 * @desc    Get Current User Profile
 * @route   GET /api/auth/profile
 */
export const getProfile = async (req, res) => {
  try {
    const { id, role } = req.user;
    let user;

    if (role === 'admin' || role === 'superadmin') {
      user = await Admin.findById(id);
    } else if (role === 'guard') {
      user = await Guard.findById(id);
    } else {
      user = await Resident.findById(id);
    }

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching profile' });
  }
};

/**
 * @desc    Update User Profile
 * @route   PATCH /api/auth/profile
 */
export const updateProfile = async (req, res) => {
  try {
    const { id, role } = req.user;
    const { full_name, email, phone, house_number, bio, blood_group, emergency_contact, family_members, vehicles, pets } = req.body;

    let user;
    const updateData = {};
    if (full_name !== undefined) updateData.full_name = full_name;
    if (email !== undefined) updateData.email = email;
    if (phone !== undefined) updateData.phone = phone;
    if (house_number !== undefined) updateData.house_number = house_number;
    if (bio !== undefined) updateData.bio = bio;
    if (blood_group !== undefined) updateData.blood_group = blood_group;
    if (emergency_contact !== undefined) updateData.emergency_contact = emergency_contact;

    // Handle stringified arrays from FormData
    if (family_members) updateData.family_members = typeof family_members === 'string' ? JSON.parse(family_members) : family_members;
    if (vehicles) updateData.vehicles = typeof vehicles === 'string' ? JSON.parse(vehicles) : vehicles;
    if (pets) updateData.pets = typeof pets === 'string' ? JSON.parse(pets) : pets;

    // If an image was uploaded via Cloudinary middleware
    if (req.file) {
      updateData.profile_image = req.file.path;
    }

    if (role === 'admin' || role === 'superadmin') {
      user = await Admin.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    } else if (role === 'guard') {
      user = await Guard.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    } else {
      user = await Resident.findByIdAndUpdate(id, { $set: updateData }, { new: true });
    }

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Remove password from response if present
    const userObj = user.toObject();
    delete userObj.password;

    res.status(200).json({
      message: 'Profile updated successfully',
      user: userObj
    });
  } catch (error) {
    console.error('Update Profile Error:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
};

/**
 * @desc    Enable Biometric Login
 * @route   POST /api/auth/enable-biometrics
 */
export const enableBiometrics = async (req, res) => {
  try {
    const { id, role } = req.user;
    const { publicKey } = req.body;

    if (!publicKey) return res.status(400).json({ message: 'Public key is required' });

    let user;
    if (role === 'admin' || role === 'superadmin') {
      user = await Admin.findByIdAndUpdate(id, { biometricPublicKey: publicKey }, { new: true });
    } else if (role === 'guard') {
      user = await Guard.findByIdAndUpdate(id, { biometricPublicKey: publicKey }, { new: true });
    } else {
      user = await Resident.findByIdAndUpdate(id, { biometricPublicKey: publicKey }, { new: true });
    }

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ message: 'Biometrics enabled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error enabling biometrics' });
  }
};

/**
 * @desc    Verify Biometric Login
 * @route   POST /api/auth/biometric-login
 */
export const biometricLogin = async (req, res) => {
  try {
    const { email, signature, payload } = req.body;

    if (!email || !signature || !payload) {
      return res.status(400).json({ message: 'Email, signature and payload are required' });
    }

    // Basic Replay Protection: Ensure payload is a timestamp and within 5 minutes
    try {
      const timestamp = parseInt(payload.split('-').pop());
      if (isNaN(timestamp) || Date.now() - timestamp > 300000) {
        return res.status(401).json({ message: 'Authentication challenge expired. Please try again.' });
      }
    } catch (e) {
      return res.status(400).json({ message: 'Invalid payload format' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Find user in any collection
    const user = await Admin.findOne({ email: normalizedEmail }) ||
      await Guard.findOne({ email: normalizedEmail }) ||
      await Resident.findOne({ email: normalizedEmail });

    if (!user || !user.biometricPublicKey) {
      return res.status(401).json({ message: 'Biometric login not enabled for this account' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: 'Account is not active' });
    }

    // Verify Signature
    const verifier = crypto.createVerify('sha256');
    verifier.update(payload);
    verifier.end();

    const isVerified = verifier.verify(
      `-----BEGIN PUBLIC KEY-----\n${user.biometricPublicKey}\n-----END PUBLIC KEY-----`,
      signature,
      'base64'
    );

    if (!isVerified) {
      return res.status(401).json({ message: 'Biometric verification failed' });
    }

    // Success - generate token
    const role = user.constructor.modelName.toLowerCase();
    res.status(200).json({
      _id: user._id,
      full_name: user.full_name,
      email: user.email,
      role: role,
      status: user.status,
      token: generateToken(user._id, role),
    });

  } catch (error) {
    console.error("Biometric Login Error:", error);
    res.status(500).json({ message: 'Server error during biometric login' });
  }
};
