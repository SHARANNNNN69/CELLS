import express from 'express';
import pool from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';

const router = express.Router();

router.get('/health', async (req, res) => {
    try {
        const [result] = await pool.query('SELECT 1 as healthy, NOW() as server_time');
        return successResponse(res, 'CELLS API Server and Database are operational', {
            status: 'HEALTHY',
            service: 'CELLS - Blood Donation & Emergency Network',
            database: 'Connected (MySQL 8.0)',
            timestamp: result[0].server_time,
            uptimeSeconds: Math.floor(process.uptime())
        });
    } catch (err) {
        return errorResponse(res, 'Service degraded - database connection error', 503, {
            error: err.message
        });
    }
});

export default router;
