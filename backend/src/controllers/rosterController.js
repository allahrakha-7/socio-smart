import Roster from '../models/rosterModel.js';
import Staff from '../models/staffModel.js';
import Guard from '../models/guardModel.js';

export const createRosterEntry = async (req, res) => {
  try {
    const { staff, staffType, day, shift_start, shift_end, location, task } = req.body;

    // Check if staff exists in either model
    let staffMember;
    if (staffType === 'Guard') {
      staffMember = await Guard.findById(staff);
    } else {
      staffMember = await Staff.findById(staff);
    }

    if (!staffMember) return res.status(404).json({ message: 'Staff member not found' });

    const roster = await Roster.create({
      staff,
      staffType: staffType || 'Staff',
      day,
      shift_start,
      shift_end,
      location,
      task,
    });

    const populatedRoster = await Roster.findById(roster._id).populate('staff', 'full_name role');
    res.status(201).json(populatedRoster);
  } catch (error) {
    res.status(500).json({ message: 'Error creating roster entry' });
  }
};

export const getFullRoster = async (req, res) => {
  try {
    const rosters = await Roster.find({}).populate('staff', 'full_name role');
    res.status(200).json(rosters);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching roster' });
  }
};

export const getStaffRoster = async (req, res) => {
  try {
    const { staffId } = req.params;
    const rosters = await Roster.find({ staff: staffId }).populate('staff', 'full_name role');
    res.status(200).json(rosters);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching staff roster' });
  }
};

export const deleteRosterEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const roster = await Roster.findByIdAndDelete(id);
    if (!roster) return res.status(404).json({ message: 'Roster entry not found' });
    res.status(200).json({ message: 'Roster entry removed' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting roster entry' });
  }
};

export const updateRosterEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const roster = await Roster.findByIdAndUpdate(id, updateData, { new: true }).populate('staff', 'full_name role');
    if (!roster) return res.status(404).json({ message: 'Roster entry not found' });
    res.status(200).json(roster);
  } catch (error) {
    res.status(500).json({ message: 'Error updating roster entry' });
  }
};
export const getCurrentGuardObj = async () => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const now = new Date();
  const currentDay = days[now.getDay()];

  const parseTimeStr = (timeStr) => {
    if (!timeStr) return 0;
    const parts = timeStr.split(' ');
    if (parts.length < 2) return 0;
    const [time, modifier] = parts;
    let [hours, minutes] = time.split(':');
    if (hours === '12') hours = '00';
    if (modifier === 'PM') hours = parseInt(hours, 10) + 12;
    return parseInt(hours, 10) * 60 + parseInt(minutes, 10);
  };

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const guardsForToday = await Roster.find({
    day: currentDay,
    staffType: 'Guard',
    status: 'active'
  }).populate('staff', 'full_name phone bio profile_image');

  return guardsForToday.find(r => {
    const start = parseTimeStr(r.shift_start);
    const end = parseTimeStr(r.shift_end);
    
    if (end < start) {
      return currentMinutes >= start || currentMinutes <= end;
    }
    return currentMinutes >= start && currentMinutes <= end;
  });
};

export const getCurrentDutyGuard = async (req, res) => {
  try {
    const currentGuard = await getCurrentGuardObj();
    if (!currentGuard) {
      return res.status(200).json(null);
    }
    res.status(200).json(currentGuard);
  } catch (error) {
    console.error('Error in getCurrentDutyGuard:', error);
    res.status(500).json({ message: 'Error fetching current duty guard' });
  }
};
