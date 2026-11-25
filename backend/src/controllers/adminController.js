import pool from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { logAuditEvent } from '../utils/auditLogger.js';

export const getPlatformMetrics = async (req, res) => {
    try {
        const [[userCounts]] = await pool.query('SELECT COUNT(*) as total_users FROM users');
        const [[bankCounts]] = await pool.query("SELECT COUNT(*) as total_banks FROM blood_banks WHERE verification_status = 'verified'");
        const [[hospCounts]] = await pool.query("SELECT COUNT(*) as total_hospitals FROM hospitals WHERE verification_status = 'verified'");
        const [[reqCounts]] = await pool.query("SELECT COUNT(*) as total_requests, SUM(CASE WHEN status='open' THEN 1 ELSE 0 END) as open_requests FROM blood_requests");
        const [[stockCounts]] = await pool.query("SELECT COALESCE(SUM(units_available), 0) as total_units FROM inventory_batches WHERE status='tested_safe' AND expiry_date >= CURDATE()");

        return successResponse(res, 'Admin metrics retrieved', {
            users: userCounts.total_users,
            verifiedBanks: bankCounts.total_banks,
            verifiedHospitals: hospCounts.total_hospitals,
            totalRequests: reqCounts.total_requests,
            openRequests: reqCounts.open_requests || 0,
            availableTestedUnits: stockCounts.total_units
        });
    } catch (err) {
        return errorResponse(res, 'Failed to fetch admin metrics', 500, err.message);
    }
};

export const getUsers = async (req, res) => {
    try {
        const { role, search } = req.query;
        let query = 'SELECT id, full_name, email, phone, role, is_active, created_at FROM users WHERE 1=1';
        const params = [];

        if (role) {
            query += ' AND role = ?';
            params.push(role);
        }

        if (search) {
            query += ' AND (full_name LIKE ? OR email LIKE ?)';
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ' ORDER BY id DESC LIMIT 100';

        const [users] = await pool.query(query, params);
        return successResponse(res, 'Users retrieved', users);
    } catch (err) {
        return errorResponse(res, 'Failed to retrieve users', 500, err.message);
    }
};

export const toggleUserStatus = async (req, res) => {
    const userId = req.params.id;
    const { is_active } = req.body;

    try {
        await pool.query('UPDATE users SET is_active = ? WHERE id = ?', [is_active, userId]);
        await logAuditEvent(req.user.id, 'USER_STATUS_TOGGLED', 'USER', userId, { is_active }, req);
        return successResponse(res, `User status updated to ${is_active ? 'active' : 'suspended'}`);
    } catch (err) {
        return errorResponse(res, 'Failed to update user status', 500, err.message);
    }
};

export const getPendingVerifications = async (req, res) => {
    try {
        const [pendingHospitals] = await pool.query("SELECT * FROM hospitals WHERE verification_status = 'pending'");
        const [pendingBanks] = await pool.query("SELECT * FROM blood_banks WHERE verification_status = 'pending'");

        return successResponse(res, 'Pending verifications retrieved', {
            hospitals: pendingHospitals,
            bloodBanks: pendingBanks
        });
    } catch (err) {
        return errorResponse(res, 'Failed to retrieve pending verifications', 500, err.message);
    }
};

export const updateVerificationStatus = async (req, res) => {
    const { type, id } = req.params;
    const { status } = req.body; // 'verified' or 'rejected'

    if (!['verified', 'rejected'].includes(status)) {
        return errorResponse(res, 'Status must be verified or rejected', 400);
    }

    try {
        const table = type === 'hospital' ? 'hospitals' : type === 'blood_bank' ? 'blood_banks' : null;
        if (!table) {
            return errorResponse(res, 'Invalid verification type. Must be hospital or blood_bank', 400);
        }

        await pool.query(`UPDATE ${table} SET verification_status = ? WHERE id = ?`, [status, id]);
        await logAuditEvent(req.user.id, 'VERIFICATION_STATUS_CHANGED', type.toUpperCase(), id, { status }, req);

        return successResponse(res, `${type} verification marked as ${status}`);
    } catch (err) {
        return errorResponse(res, 'Failed to update verification status', 500, err.message);
    }
};

export const getAuditLogs = async (req, res) => {
    try {
        const [logs] = await pool.query(`
            SELECT al.*, u.full_name as user_name, u.role as user_role
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            ORDER BY al.created_at DESC
            LIMIT 100
        `);
        return successResponse(res, 'Audit logs retrieved', logs);
    } catch (err) {
        return errorResponse(res, 'Failed to retrieve audit logs', 500, err.message);
    }
};
