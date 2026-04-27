import express from 'express';
import { createAnnouncement, listAnnouncements, deleteAnnouncement } from '../controllers/announcementController.js';
import { protect, requireAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', protect, listAnnouncements);
router.post('/', protect, requireAdmin, createAnnouncement);
router.delete('/:id', protect, requireAdmin, deleteAnnouncement);

export default router;
