import express from 'express';
import { createNotice, deleteNotice, listNotices, updateNotice } from '../controllers/noticeController.js';
import { protect, requireAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', protect, listNotices);
router.post('/', protect, requireAdmin, createNotice);
router.put('/:id', protect, requireAdmin, updateNotice);
router.delete('/:id', protect, requireAdmin, deleteNotice);

export default router;
