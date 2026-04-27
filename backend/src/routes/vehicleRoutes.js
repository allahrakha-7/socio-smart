import express from 'express';
import { listVehicles, createVehicle, updateVehicle, deleteVehicle, approveVehicle, verifyVehicleAccess } from '../controllers/vehicleController.js';
import { protect, requireAdmin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/', protect, listVehicles);
router.post('/', protect, createVehicle);
router.post('/verify-access', protect, verifyVehicleAccess);
router.put('/:id', protect, updateVehicle);
router.patch('/:id/approve', protect, requireAdmin, approveVehicle);
router.delete('/:id', protect, deleteVehicle);

export default router;
