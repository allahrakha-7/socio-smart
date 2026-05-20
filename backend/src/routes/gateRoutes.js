import express from 'express';
import { createEntry, markExit, getGateLogs, getDailyStats, getMyGateLogs, deleteGateLog, verifyGateAccess, getRecentGateActivity, manualTriggerGate, notifyGateScanning } from '../controllers/gateController.js';
import { protect, requireAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Admin and Guard routes
router.get('/logs', protect, getGateLogs);
router.get('/review', protect, requireAdmin, getGateLogs);
router.get('/stats', protect, getDailyStats);

// IoT and Gate Activity Monitoring
router.post('/verify', verifyGateAccess); // Scanned by NPR Camera (Expert Interface)
router.post('/scanning', notifyGateScanning);
router.get('/recent-activity', protect, getRecentGateActivity);
router.post('/manual-trigger', protect, manualTriggerGate); // Manual Override (Fail-safe)

// Resident routes
router.get('/my', protect, getMyGateLogs);

// Guard routes (entry/exit)
router.post('/entry', protect, createEntry);
router.patch('/exit/:id', protect, markExit);
router.delete('/:id', protect, requireAdmin, deleteGateLog);

export default router;
