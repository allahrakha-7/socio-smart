import Notice from '../models/noticeModel.js';
import Admin from '../models/adminModel.js';

export const listNotices = async (req, res) => {
  try {
    const notices = await Notice.find({})
      .sort({ publishDate: -1, createdAt: -1 })
      .lean();
    return res.status(200).json(notices);
  } catch (error) {
    return res.status(500).json({ message: 'Server error while fetching notices' });
  }
};

export const createNotice = async (req, res) => {
  try {
    const { title, description, isUrgent, publishDate } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    const admin = await Admin.findById(req.user.id).lean();
    const author = admin?.full_name ? String(admin.full_name) : 'Admin';

    const notice = await Notice.create({
      title: String(title).trim(),
      description: String(description).trim(),
      isUrgent: Boolean(isUrgent),
      publishDate: publishDate ? new Date(publishDate) : new Date(),
      author,
      createdBy: req.user.id,
    });

    return res.status(201).json(notice);
  } catch (error) {
    console.error("Notice Creation Error:", error);
    return res.status(500).json({ message: 'Server error while creating notice' });
  }
};

export const updateNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, isUrgent, publishDate } = req.body;

    const notice = await Notice.findById(id);
    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    if (typeof title === 'string') notice.title = title.trim();
    if (typeof description === 'string') notice.description = description.trim();
    if (typeof isUrgent !== 'undefined') notice.isUrgent = Boolean(isUrgent);
    if (publishDate) notice.publishDate = new Date(publishDate);

    await notice.save();
    return res.status(200).json(notice);
  } catch (error) {
    return res.status(500).json({ message: 'Server error while updating notice' });
  }
};

export const deleteNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const notice = await Notice.findById(id);
    if (!notice) {
      return res.status(404).json({ message: 'Notice not found' });
    }

    await Notice.deleteOne({ _id: id });
    return res.status(200).json({ message: 'Notice deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error while deleting notice' });
  }
};
