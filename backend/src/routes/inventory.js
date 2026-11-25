import express from 'express';
import { 
    getInventoryBatches, createBatch, 
    updateBatchStatus, getInventoryAuditLogs 
} from '../controllers/inventoryController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authenticateToken, authorizeRoles('blood_bank', 'admin'), getInventoryBatches);
router.post('/', authenticateToken, authorizeRoles('blood_bank', 'admin'), createBatch);
router.patch('/:id', authenticateToken, authorizeRoles('blood_bank', 'admin'), updateBatchStatus);
router.get('/audit-logs', authenticateToken, authorizeRoles('blood_bank', 'admin'), getInventoryAuditLogs);

export default router;
