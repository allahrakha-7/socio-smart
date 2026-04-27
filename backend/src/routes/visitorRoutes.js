import express from 'express';
import { 
  createPreApproval, 
  getMyPreApprovals, 
  cancelPreApproval, 
  verifyPassCode,
  searchResidentByHouse,
  requestAdhocEntry,
  handleAdhocApproval 
} from '../controllers/visitorController.js';
import { protect } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Resident routes
router.post('/pre-approve', protect, createPreApproval);
router.get('/my-visitors', protect, getMyPreApprovals);
router.delete('/cancel/:id', protect, cancelPreApproval);
router.patch('/approval/:id', protect, handleAdhocApproval); // Resident approves/denies

// Guard/Admin routes
router.get('/verify/:code', protect, verifyPassCode);
router.get('/search-house/:house_number', protect, searchResidentByHouse);
router.post('/request-entry', protect, requestAdhocEntry);

export default router;
