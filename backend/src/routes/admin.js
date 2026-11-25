import express from 'express';
import { 
    getPlatformMetrics, getUsers, toggleUserStatus, 
    getPendingVerifications, updateVerificationStatus, getAuditLogs 
} from '../controllers/adminController.js';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles('admin'));

router.get('/metrics', getPlatformMetrics);
router.get('/users', getUsers);
router.patch('/users/:id/status', toggleUserStatus);
router.get('/verifications', getPendingVerifications);
router.patch('/verifications/:type/:id', updateVerificationStatus);
router.get('/audit-logs', getAuditLogs);

export default router;
