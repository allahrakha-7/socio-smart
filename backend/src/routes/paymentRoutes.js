import express from 'express';
import { getAdminPayments, getMyPayments, updatePaymentStatus, submitPaymentProof } from '../controllers/paymentController.js';
import { protect, requireAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/admin/all', protect, requireAdmin, getAdminPayments);
router.get('/my', protect, getMyPayments);
router.patch('/:id/status', protect, requireAdmin, updatePaymentStatus);
router.post('/:id/proof', protect, submitPaymentProof);

export default router;
