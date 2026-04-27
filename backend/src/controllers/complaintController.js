import Complaint from '../models/complaintModel.js';

export const getAllComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({})
      .populate('resident', 'full_name house_number phone')
      .populate('assignedTo', 'full_name role phone')
      .sort({ createdAt: -1 });
    res.status(200).json(complaints);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching complaints' });
  }
};

export const createComplaint = async (req, res) => {
  try {
    const { title, description, category, isUrgent, requestLevel, image, amenity } = req.body;
    const residentId = req.user.id;

    const complaint = await Complaint.create({
      resident: residentId,
      title,
      description,
      category,
      isUrgent: Boolean(isUrgent),
      requestLevel: requestLevel || 'Unit Level',
      image: image || '',
      amenity: amenity || null,
    });

    res.status(201).json(complaint);
  } catch (error) {
    res.status(500).json({ message: 'Error submitting complaint' });
  }
};

export const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes, assignedTo } = req.body;

    const update = {};
    if (status) update.status = status;
    if (adminNotes !== undefined) update.adminNotes = adminNotes;
    if (assignedTo !== undefined) update.assignedTo = assignedTo;
    if (status === 'resolved') update.resolvedAt = Date.now();

    const complaint = await Complaint.findByIdAndUpdate(id, update, { new: true });
    if (!complaint) return res.status(404).json({ message: 'Complaint not found' });

    res.status(200).json(complaint);
  } catch (error) {
    res.status(500).json({ message: 'Error updating complaint' });
  }
};

export const getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ resident: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(complaints);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching your complaints' });
  }
};
