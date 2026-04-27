import express from 'express';
import { triggerSOS, getActiveAlerts, resolveAlert } from '../controllers/alertController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.post('/sos', protect, triggerSOS);
router.get('/active', protect, getActiveAlerts);
router.patch('/resolve/:id', protect, resolveAlert);

export default router;
