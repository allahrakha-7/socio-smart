import express from 'express';
import { getAllComplaints, createComplaint, updateComplaintStatus, getMyComplaints } from '../controllers/complaintController.js';
import { protect, requireAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Admin routes
router.get('/all', protect, requireAdmin, getAllComplaints);
router.patch('/status/:id', protect, requireAdmin, updateComplaintStatus);

// Resident routes
router.post('/', protect, createComplaint);
router.get('/my', protect, getMyComplaints);

export default router;
