import Communication from '../models/communicationModel.js';
import Resident from '../models/residentModel.js';

/**
 * @desc    Initialize a Digital Ping (Call Security)
 * @route   POST /api/communications/ping
 */
export const sendPing = async (req, res) => {
  try {
    const resident = await Resident.findById(req.user.id);
    if (!resident) return res.status(404).json({ message: 'Resident not found' });

    const { type, subject } = req.body;

    const comm = await Communication.create({
      resident: resident._id,
      resident_name: resident.full_name,
      house_number: resident.house_number || 'N/A',
      type: type || 'Standard',
      subject: subject || 'Call Request',
      status: 'pending'
    });

    // Notify Guards via Socket
    const io = req.app.get('io');
    if (io) {
      io.emit('security_ping', {
        id: comm._id,
        sender: resident.full_name,
        house: resident.house_number,
        type: comm.type,
        time: comm.createdAt
      });
    }

    res.status(201).json(comm);
  } catch (error) {
    res.status(500).json({ message: 'Failed to initiate security ping' });
  }
};

/**
 * @desc    Get all communication logs (Admin/Guard)
 * @route   GET /api/communications/history
 */
export const getCommHistory = async (req, res) => {
  try {
    const history = await Communication.find()
      .populate('resident', 'full_name house_number phone')
      .populate('guard', 'full_name')
      .sort({ createdAt: -1 });
    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch communication history' });
  }
};

/**
 * @desc    Update communication status (Handled by Guard)
 * @route   PATCH /api/communications/handle/:id
 */
export const handlePing = async (req, res) => {
  try {
    const { id } = req.params;
    const comm = await Communication.findByIdAndUpdate(
      id,
      { 
        status: 'handled',
        guard: req.user.id,
        endTime: new Date()
      },
      { new: true }
    );
    if (!comm) return res.status(404).json({ message: 'Call log not found' });
    res.status(200).json(comm);
  } catch (error) {
    res.status(500).json({ message: 'Error handling call' });
  }
};
