import express from 'express';
import { getDonors, getMyProfile, updateMyProfile, getDonationHistory } from '../controllers/donorController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Public search for potential donors with privacy masking
router.get('/', getDonors);

// Protected donor profile endpoints
router.get('/me', authenticateToken, authorizeRoles('donor', 'admin'), getMyProfile);
router.put('/me', authenticateToken, authorizeRoles('donor', 'admin'), updateMyProfile);
router.get('/history', authenticateToken, authorizeRoles('donor', 'admin'), getDonationHistory);

export default router;
