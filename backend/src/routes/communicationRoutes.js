import express from 'express';
import { sendPing, getCommHistory, handlePing } from '../controllers/communicationController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/ping', protect, sendPing);
router.get('/history', protect, getCommHistory);
router.patch('/handle/:id', protect, handlePing);

export default router;
