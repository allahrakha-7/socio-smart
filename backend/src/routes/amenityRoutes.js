import express from 'express';
import { 
  getAmenities, 
  bookAmenity, 
  getBookedSlots, 
  getAdminBookings, 
  updateBookingStatus,
  updateAmenityStatus,
  createAmenity
} from '../controllers/amenityController.js';
import { protect, requireAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Resident Routes
router.get('/', protect, getAmenities);
router.post('/book', protect, bookAmenity);
router.get('/:id/booked-slots', protect, getBookedSlots);

// Admin Routes
router.post('/admin/create', protect, requireAdmin, createAmenity);
router.get('/bookings/admin/all', protect, requireAdmin, getAdminBookings);
router.patch('/bookings/admin/:id/status', protect, requireAdmin, updateBookingStatus);
router.patch('/admin/:id/status', protect, requireAdmin, updateAmenityStatus);

export default router;
