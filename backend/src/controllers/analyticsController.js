import pool from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const getAnalyticsDashboard = async (req, res) => {
    try {
        // 1. Available stock by blood group
        const [stockByGroup] = await pool.query(`
            SELECT blood_group, SUM(units_available) as units
            FROM inventory_batches
            WHERE status = 'tested_safe' AND expiry_date >= CURDATE()
            GROUP BY blood_group
            ORDER BY blood_group
        `);

        // 2. Available stock by component
        const [stockByComponent] = await pool.query(`
            SELECT component, SUM(units_available) as units
            FROM inventory_batches
            WHERE status = 'tested_safe' AND expiry_date >= CURDATE()
            GROUP BY component
            ORDER BY units DESC
        `);

        // 3. Blood requests by urgency
        const [requestsByUrgency] = await pool.query(`
            SELECT urgency, COUNT(*) as count
            FROM blood_requests
            GROUP BY urgency
        `);

        // 4. Blood requests by status
        const [requestsByStatus] = await pool.query(`
            SELECT status, COUNT(*) as count
            FROM blood_requests
            GROUP BY status
        `);

        // 5. Expiring stock in next 7 days alert
        const [expiringBatches] = await pool.query(`
            SELECT ib.batch_number, ib.blood_group, ib.component, ib.units_available, ib.expiry_date, b.name as blood_bank_name
            FROM inventory_batches ib
            JOIN blood_banks b ON ib.blood_bank_id = b.id
            WHERE ib.status = 'tested_safe' AND ib.expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)
            ORDER BY ib.expiry_date ASC
        `);

        return successResponse(res, 'Analytics dashboard data retrieved', {
            disclaimer: 'Based on demonstrative system database records, not national statistics.',
            stockByGroup,
            stockByComponent,
            requestsByUrgency,
            requestsByStatus,
            expiringBatches
        });
    } catch (err) {
        return errorResponse(res, 'Failed to fetch analytics', 500, err.message);
    }
};
