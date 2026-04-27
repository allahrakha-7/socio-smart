import Announcement from '../models/announcementModel.js';

export const createAnnouncement = async (req, res) => {
  try {
    const { title, content, priority, image } = req.body;
    const announcement = await Announcement.create({
      title,
      content,
      priority,
      image,
      createdBy: req.user.id
    });
    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const listAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .sort({ createdAt: -1 })
      .populate('createdBy', 'full_name');
    res.status(200).json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    await Announcement.findByIdAndDelete(id);
    res.status(200).json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
