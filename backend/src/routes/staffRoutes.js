import express from 'express';
import { createStaff, getStaffDirectory, updateStaffStatus, deleteStaff, updateStaff, getStaffStats } from '../controllers/staffController.js';
import { protect, requireAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/directory', protect, getStaffDirectory);
router.get('/stats', protect, getStaffStats);
router.post('/add', protect, requireAdmin, createStaff);
router.patch('/status/:id', protect, requireAdmin, updateStaffStatus);
router.put('/:id', protect, requireAdmin, updateStaff);
router.delete('/:id', protect, requireAdmin, deleteStaff);

export default router;
