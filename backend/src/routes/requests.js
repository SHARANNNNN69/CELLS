import express from 'express';
import { 
    getRequests, getRequestById, createRequest, 
    cancelRequest, respondToRequest, fulfillRequest 
} from '../controllers/requestController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getRequests);
router.get('/:id', getRequestById);

// Protected routes
router.post('/', authenticateToken, createRequest);
router.patch('/:id/cancel', authenticateToken, cancelRequest);
router.post('/:id/respond', authenticateToken, respondToRequest);
router.patch('/:id/fulfill', authenticateToken, authorizeRoles('blood_bank', 'admin'), fulfillRequest);

export default router;
