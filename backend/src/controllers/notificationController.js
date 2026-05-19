import Notification from '../models/notificationModel.js';

// Get notifications for logged in user (or global broadcasts)
export const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    // Find notifications sent specifically to the user or broadcasted globally (recipient is null)
    const notifications = await Notification.find({
      $or: [
        { recipient: userId },
        { recipient: null }
      ]
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return res.status(200).json(notifications);
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return res.status(500).json({ message: 'Server error while fetching notifications' });
  }
};

// Mark notification as read
export const markNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.body;

    if (notificationId) {
      // Mark a single notification as read
      await Notification.updateOne(
        { _id: notificationId, $or: [{ recipient: userId }, { recipient: null }] },
        { $set: { isRead: true } }
      );
    } else {
      // Mark all notifications for this user as read
      await Notification.updateMany(
        { $or: [{ recipient: userId }, { recipient: null }], isRead: false },
        { $set: { isRead: true } }
      );
    }

    return res.status(200).json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    console.error('Mark read notifications error:', error);
    return res.status(500).json({ message: 'Server error marking notifications as read' });
  }
};

// Clear/Delete notifications
export const clearNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    // Delete notifications that belong specifically to the user
    await Notification.deleteMany({ recipient: userId });
    return res.status(200).json({ success: true, message: 'Notifications cleared successfully' });
  } catch (error) {
    console.error('Clear notifications error:', error);
    return res.status(500).json({ message: 'Server error clearing notifications' });
  }
};

// Backend Helper Utility to trigger and emit a notification
export const triggerSystemNotification = async ({ recipient, title, message, category, io }) => {
  try {
    const notification = await Notification.create({
      recipient: recipient || null,
      title,
      message,
      category: category || 'System',
      isRead: false
    });

    if (io) {
      if (recipient) {
        // Emit to targeted user room
        console.log(`[Notification Engine] Routing TARGETED notifications to user_${recipient}`);
        io.to(`user_${recipient}`).emit('new_notification', notification);
      } else {
        // Broadcast globally
        console.log('[Notification Engine] Broadcasting GLOBAL notification...');
        io.emit('new_notification', notification);
      }
    }
    return notification;
  } catch (e) {
    console.error('Error creating notification:', e);
    return null;
  }
};
