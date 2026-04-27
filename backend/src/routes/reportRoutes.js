import express from 'express';
import { getOpsSummary } from '../controllers/reportController.js';
import { protect, requireAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/summary', protect, requireAdmin, getOpsSummary);

export default router;
