import express from 'express';
import {
  createRosterEntry,
  getFullRoster,
  getStaffRoster,
  deleteRosterEntry,
  updateRosterEntry,
  getCurrentDutyGuard,
} from '../controllers/rosterController.js';
import { protect, requireAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/all', protect, getFullRoster);
router.get('/staff/:staffId', protect, getStaffRoster);
router.get('/current-duty', protect, getCurrentDutyGuard);
router.post('/add', protect, requireAdmin, createRosterEntry);
router.put('/:id', protect, requireAdmin, updateRosterEntry);
router.delete('/:id', protect, requireAdmin, deleteRosterEntry);

export default router;
