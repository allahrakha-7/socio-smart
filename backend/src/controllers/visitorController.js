import Visitor from '../models/visitorModel.js';
import Resident from '../models/residentModel.js';
import GateActivity from '../models/gateActivityModel.js';
import mqttService from '../utils/mqttService.js';
import crypto from 'crypto';
import { triggerSystemNotification } from './notificationController.js';

// Resident creates a pre-approval
export const createPreApproval = async (req, res) => {
  try {
    const { name, phone, type, expected_date, plate_number } = req.body;

    const resident = await Resident.findById(req.user.id);
    if (!resident) {
      return res.status(404).json({ message: 'Resident not found' });
    }

    // Generate a unique 6-digit pass code
    let pass_code;
    let isUnique = false;
    while (!isUnique) {
      pass_code = Math.floor(100000 + Math.random() * 900000).toString();
      const existing = await Visitor.findOne({ pass_code });
      if (!existing) isUnique = true;
    }

    const visitor = await Visitor.create({
      name,
      phone,
      type: type || 'Visitor',
      expected_date,
      plate_number: plate_number ? plate_number.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() : null,
      resident: req.user.id,
      house_number: resident.house_number || 'N/A', 
      pass_code,
      status: 'pending'
    });

    res.status(201).json(visitor);
  } catch (error) {
    console.error('Create pre-approval error:', error);
    res.status(500).json({ message: 'Error creating pre-approval' });
  }
};

// Resident gets their own pre-approvals
export const getMyPreApprovals = async (req, res) => {
  try {
    const visitors = await Visitor.find({ resident: req.user.id }).sort({ expected_date: -1 });
    res.status(200).json(visitors);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching your pre-approvals' });
  }
};

// Resident cancels a pre-approval
export const cancelPreApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const visitor = await Visitor.findOne({ _id: id, resident: req.user.id });
    
    if (!visitor) {
      return res.status(404).json({ message: 'Pre-approval not found' });
    }

    visitor.status = 'cancelled';
    await visitor.save();

    res.status(200).json({ message: 'Pre-approval cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error cancelling pre-approval' });
  }
};

// Get active pre-approvals for Guard (search by code)
export const verifyPassCode = async (req, res) => {
  try {
    const { code } = req.params;
    const visitor = await Visitor.findOne({ pass_code: code, status: 'pending' }).populate('resident', 'full_name phone house_number');

    if (!visitor) {
      return res.status(404).json({ message: 'Invalid or expired pass code' });
    }

    res.status(200).json(visitor);
  } catch (error) {
    res.status(500).json({ message: 'Error verifying pass code' });
  }
};

// --- GUARD: Search Resident by House Number ---
export const searchResidentByHouse = async (req, res) => {
  try {
    const { house_number } = req.params;
    const residents = await Resident.find({ 
      house_number: { $regex: house_number, $options: 'i' },
      status: 'active'
    }).select('full_name house_number phone profile_image');

    res.status(200).json(residents);
  } catch (error) {
    res.status(500).json({ message: 'Error searching residents' });
  }
};

// --- GUARD: Request Ad-hoc Entry ---
export const requestAdhocEntry = async (req, res) => {
  try {
    const { name, phone, type, plate_number, resident_id } = req.body;

    const resident = await Resident.findById(resident_id);
    if (!resident) return res.status(404).json({ message: 'Target resident not found' });

    const visitor = await Visitor.create({
      name,
      phone,
      type: type || 'Visitor',
      plate_number: plate_number?.toUpperCase(),
      expected_date: new Date(),
      resident: resident_id,
      house_number: resident.house_number,
      is_ad_hoc: true,
      approval_status: 'requested',
      status: 'pending'
    });

    // Emit socket event to the specific resident
    const io = req.app.get('io');
    if (io) {
      // Room nomenclature: `resident_${resident_id}`
      io.to(`user_${resident_id}`).emit('adhoc_entry_request', {
        request_id: visitor._id,
        visitor_name: name,
        visitor_type: type,
        plate_number,
        gate: 'Main Security Gate'
      });
    }

    await triggerSystemNotification({
      recipient: resident_id,
      title: 'Visitor Entry Request',
      message: `${name} (${type}) is requesting entry to your flat at Main Security Gate. Please approve/deny.`,
      category: 'Visitor',
      io
    });

    res.status(201).json(visitor);
  } catch (error) {
    console.error('Adhoc request error:', error);
    res.status(500).json({ message: 'Error initiating entry request' });
  }
};

// --- RESIDENT: Handle Approval/Denial ---
export const handleAdhocApproval = async (req, res) => {
  try {
    const { id } = req.params; // Request ID (Visitor ID)
    const { status } = req.body; // 'approved' or 'denied'

    const visitor = await Visitor.findById(id).populate('resident', 'full_name house_number');
    if (!visitor) return res.status(404).json({ message: 'Request not found' });

    // Security check: Only the targeted resident can approve
    if (visitor.resident._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized approval attempt' });
    }

    visitor.approval_status = status;
    visitor.handled_at = new Date();
    if (status === 'approved') {
      visitor.status = 'arrived';
    } else {
      visitor.status = 'cancelled';
    }
    await visitor.save();

    // 1. If approved, trigger IoT Gate Actuation
    if (status === 'approved') {
      mqttService.publishGateCommand('OPEN');
      
      // 2. Log Activity
      await GateActivity.create({
        plate_number: visitor.plate_number || 'VISITOR_ENTRY',
        status: 'GRANTED',
        reason: `Ad-hoc Entry Approved by Resident (${visitor.resident.full_name})`,
        owner_name: visitor.name,
        unit: visitor.house_number,
        guard: req.user.id // Actually handled by resident but log exists
      });
    }

    // 3. Notify Guard via socket (broadcast to all guards)
    const io = req.app.get('io');
    if (io) {
      io.emit('entry_request_handled', {
        request_id: visitor._id,
        status,
        house: visitor.house_number,
        visitor: visitor.name
      });
    }

    res.status(200).json({ success: true, status });
  } catch (error) {
    console.error('Approval handler error:', error);
    res.status(500).json({ message: 'Error processing approval' });
  }
};
