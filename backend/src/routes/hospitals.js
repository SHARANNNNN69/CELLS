import express from 'express';
import { getHospitals, getMyHospital } from '../controllers/hospitalController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getHospitals);
router.get('/me', authenticateToken, getMyHospital);

export default router;
