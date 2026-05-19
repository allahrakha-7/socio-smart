import express from 'express';
import { getMyNotifications, markNotificationsAsRead, clearNotifications } from '../controllers/notificationController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', protect, getMyNotifications);
router.patch('/mark-read', protect, markNotificationsAsRead);
router.delete('/clear', protect, clearNotifications);

export default router;
