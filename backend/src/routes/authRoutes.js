import express from 'express';
import { 
  login, register, forgotPassword, resetPassword, updateUserStatus, getAllUsers, 
  getProfile, updateProfile, enableBiometrics, biometricLogin
} from '../controllers/authController.js';
import { protect } from '../middlewares/authMiddleware.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

router.post('/admin/login', login);
router.post('/login', login);
router.post('/register', register);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/enable-biometrics', protect, enableBiometrics);
router.post('/biometric-login', biometricLogin);
router.patch('/update-status', updateUserStatus);
router.get('/all', getAllUsers);

router.get('/profile', protect, getProfile);
router.patch('/profile', protect, upload.single('profile_image'), updateProfile);

export default router;
