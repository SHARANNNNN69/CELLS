import express from 'express';
import { 
    getRequests, getRequestById, createRequest, 
    cancelRequest, acceptRequest, rejectRequest,
    processRequest, dispatchRequest, fulfillRequest,
    expressDonorInterest
} from '../controllers/requestController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

// Public / Semi-protected discovery
router.get('/', getRequests);
router.get('/:id', authenticateToken, getRequestById);

// 1. Requisition creation: Strictly Hospital / Doctor or Patient / Requester
router.post('/', authenticateToken, authorizeRoles('hospital', 'requester'), createRequest);

// 2. Cancellation: Strictly original requester / hospital
router.patch('/:id/cancel', authenticateToken, cancelRequest);

// 3. Operational review & fulfillment: Strictly Blood Bank (or Super Admin)
router.patch('/:id/accept', authenticateToken, authorizeRoles('blood_bank', 'admin'), acceptRequest);
router.patch('/:id/reject', authenticateToken, authorizeRoles('blood_bank', 'admin'), rejectRequest);
router.patch('/:id/process', authenticateToken, authorizeRoles('blood_bank', 'admin'), processRequest);
router.patch('/:id/dispatch', authenticateToken, authorizeRoles('blood_bank', 'admin'), dispatchRequest);
router.patch('/:id/fulfill', authenticateToken, authorizeRoles('blood_bank', 'admin'), fulfillRequest);

// 4. Separate Donor Willingness Workflow: Strictly Donor
router.post('/:id/donor-interest', authenticateToken, authorizeRoles('donor'), expressDonorInterest);

export default router;
