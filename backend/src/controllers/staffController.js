import Staff from '../models/staffModel.js';
import Guard from '../models/guardModel.js';
import Complaint from '../models/complaintModel.js';

export const createStaff = async (req, res) => {
  try {
    const { full_name, role, phone, shift } = req.body;
    const staff = await Staff.create({ full_name, role, phone, shift });
    res.status(201).json(staff);
  } catch (error) {
    if (error.code === 11000) return res.status(400).json({ message: 'Phone number already registered' });
    res.status(500).json({ message: 'Error creating staff record' });
  }
};

export const getStaffDirectory = async (req, res) => {
  try {
    // Fetch specialized staff, guards, and active complaints
    const [staffRecords, guards, activeComplaints] = await Promise.all([
      Staff.find({}).lean(),
      Guard.find({}).select('-password').lean(),
      Complaint.find({ status: { $in: ['pending', 'in-progress'] }, assignedTo: { $ne: null } })
        .populate('resident', 'full_name house_number')
        .lean()
    ]);

    const formattedStaff = staffRecords.map(s => ({
      ...s,
      assignedTasks: activeComplaints.filter(c => c.assignedTo.toString() === s._id.toString())
    }));

    // Map guards to staff format
    const formattedGuards = guards.map(g => ({
      _id: g._id,
      full_name: g.full_name,
      role: 'Security',
      phone: g.phone,
      status: g.status === 'active' ? 'online' : (g.status === 'on-leave' ? 'on-leave' : 'offline'),
      shift: g.shifting_time,
      isGuard: true,
      assignedTasks: [] // Guards typically don't have assigned maintenance tasks
    }));

    const allStaff = [...formattedStaff, ...formattedGuards];
    res.status(200).json(allStaff);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching staff directory' });
  }
};

export const updateStaffStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    // Check if it's a specialized staff or a guard (based on prefix or separate ID check)
    let staff = await Staff.findByIdAndUpdate(id, { status }, { new: true });
    if (!staff) {
      staff = await Guard.findByIdAndUpdate(id, { status: status === 'online' ? 'active' : 'inactive' }, { new: true });
    }
    
    if (!staff) return res.status(404).json({ message: 'Staff member not found' });
    res.status(200).json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Error updating staff status' });
  }
};

export const updateStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, role, phone, shift } = req.body;
    const staff = await Staff.findByIdAndUpdate(id, { full_name, role, phone, shift }, { new: true });
    if (!staff) return res.status(404).json({ message: 'Staff member not found' });
    res.status(200).json(staff);
  } catch (error) {
    res.status(500).json({ message: 'Error updating staff record' });
  }
};

export const deleteStaff = async (req, res) => {
  try {
    const { id } = req.params;
    const staff = await Staff.findByIdAndDelete(id);
    if (!staff) {
      // If not in Staff, check if it's a guard (optional, usually guards are handled in user management)
      const guard = await Guard.findByIdAndDelete(id);
      if (!guard) return res.status(404).json({ message: 'Staff member not found' });
    }
    res.status(200).json({ message: 'Staff member removed' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting staff member' });
  }
};

export const getStaffStats = async (req, res) => {
  try {
    const [staffTotal, onlineStaff, staffOnLeave, guardTotal, onlineGuards, guardsOnLeave] = await Promise.all([
      Staff.countDocuments({}),
      Staff.countDocuments({ status: 'online' }),
      Staff.countDocuments({ status: 'on-leave' }),
      Guard.countDocuments({}),
      Guard.countDocuments({ status: 'active' }),
      Guard.countDocuments({ status: 'on-leave' })
    ]);
    
    res.status(200).json({
      guards: { 
        total: guardTotal, 
        onDuty: onlineGuards, 
        onLeave: guardsOnLeave 
      },
      serviceStaff: { 
        total: staffTotal, 
        onDuty: onlineStaff, 
        onLeave: staffOnLeave 
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching staff stats' });
  }
};
