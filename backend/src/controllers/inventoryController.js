import pool from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { logAuditEvent } from '../utils/auditLogger.js';

export const getInventoryBatches = async (req, res) => {
    try {
        let bankId = req.query.bank_id;

        // If user is blood bank staff, strictly scope to their own bank
        if (req.user && req.user.role === 'blood_bank') {
            const [staff] = await pool.query('SELECT blood_bank_id FROM blood_bank_staff WHERE user_id = ?', [req.user.id]);
            if (staff.length) {
                bankId = staff[0].blood_bank_id;
            }
        }

        if (!bankId && req.user?.role !== 'admin') {
            return errorResponse(res, 'Blood bank ID required', 400);
        }

        let query = `
            SELECT 
                ib.*,
                b.name as blood_bank_name,
                DATEDIFF(ib.expiry_date, CURDATE()) as days_until_expiry,
                CASE 
                    WHEN ib.expiry_date < CURDATE() THEN 'expired'
                    ELSE ib.status
                END as effective_status
            FROM inventory_batches ib
            JOIN blood_banks b ON ib.blood_bank_id = b.id
        `;
        const params = [];

        if (bankId) {
            query += ' WHERE ib.blood_bank_id = ?';
            params.push(bankId);
        }

        query += ' ORDER BY ib.expiry_date ASC, ib.created_at DESC';

        const [batches] = await pool.query(query, params);

        return successResponse(res, 'Inventory batches retrieved', batches);
    } catch (err) {
        return errorResponse(res, 'Failed to fetch inventory batches', 500, err.message);
    }
};

export const createBatch = async (req, res) => {
    if (req.user.role !== 'blood_bank' && req.user.role !== 'admin') {
        return errorResponse(res, "Access denied. Only authorized Blood Bank personnel can add inventory stock.", 403);
    }

    const { batch_number, blood_group, component, units_available, collection_date, expiry_date, status, storage_location } = req.body;

    if (!batch_number || !blood_group || !units_available || !collection_date || !expiry_date) {
        return errorResponse(res, 'Required fields: batch_number, blood_group, units_available, collection_date, expiry_date.', 400);
    }

    try {
        const [staff] = await pool.query('SELECT blood_bank_id FROM blood_bank_staff WHERE user_id = ?', [req.user.id]);
        if (!staff.length && req.user.role !== 'admin') {
            return errorResponse(res, 'User is not associated with an authorized blood bank', 403);
        }

        const bankId = staff[0].blood_bank_id;

        const [insertRes] = await pool.query(`
            INSERT INTO inventory_batches (
                blood_bank_id, batch_number, blood_group, component, units_available, units_reserved, collection_date, expiry_date, status, storage_location
            ) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?)
        `, [
            bankId,
            batch_number,
            blood_group,
            component || 'Whole Blood',
            units_available,
            collection_date,
            expiry_date,
            status || 'quarantined',
            storage_location || 'Main Storage Chamber'
        ]);

        const batchId = insertRes.insertId;

        // Record audit transaction
        await pool.query(`
            INSERT INTO inventory_transactions (
                batch_id, blood_bank_id, change_units, transaction_type, reason, performed_by_user_id
            ) VALUES (?, ?, ?, 'addition', 'New batch intake recorded', ?)
        `, [batchId, bankId, units_available, req.user.id]);

        await logAuditEvent(req.user.id, 'BATCH_CREATED', 'INVENTORY', batchId, { batch_number, blood_group, units_available }, req);

        return successResponse(res, 'Inventory batch added successfully', { id: batchId }, 201);
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            return errorResponse(res, 'Batch number already exists for this blood bank.', 409);
        }
        return errorResponse(res, 'Failed to create inventory batch', 500, err.message);
    }
};

export const updateBatchStatus = async (req, res) => {
    if (req.user.role !== 'blood_bank' && req.user.role !== 'admin') {
        return errorResponse(res, "Access denied. Only authorized Blood Bank personnel can update inventory status.", 403);
    }

    const batchId = req.params.id;
    const { status, storage_location } = req.body;

    if (!status) {
        return errorResponse(res, 'Status is required (quarantined, tested_safe, rejected, expired, depleted).', 400);
    }

    try {
        const [batchRows] = await pool.query('SELECT blood_bank_id FROM inventory_batches WHERE id = ?', [batchId]);
        if (!batchRows.length) return errorResponse(res, 'Batch not found', 404);

        // STRICT RBAC OWNERSHIP CHECK: A Blood Bank cannot modify another Blood Bank's inventory
        if (req.user.role === 'blood_bank') {
            const [staff] = await pool.query('SELECT blood_bank_id FROM blood_bank_staff WHERE user_id = ?', [req.user.id]);
            if (!staff.length || staff[0].blood_bank_id !== batchRows[0].blood_bank_id) {
                return errorResponse(res, "Access forbidden. A blood bank cannot modify another blood bank's inventory.", 403);
            }
        }

        await pool.query(`
            UPDATE inventory_batches
            SET status = ?, storage_location = COALESCE(?, storage_location)
            WHERE id = ?
        `, [status, storage_location, batchId]);

        await logAuditEvent(req.user.id, 'BATCH_STATUS_UPDATED', 'INVENTORY', batchId, { newStatus: status }, req);

        return successResponse(res, 'Batch status updated successfully');
    } catch (err) {
        return errorResponse(res, 'Failed to update batch status', 500, err.message);
    }
};

export const getInventoryAuditLogs = async (req, res) => {
    try {
        let bankId = req.query.bank_id;

        if (req.user.role === 'blood_bank') {
            const [staff] = await pool.query('SELECT blood_bank_id FROM blood_bank_staff WHERE user_id = ?', [req.user.id]);
            if (staff.length) bankId = staff[0].blood_bank_id;
        }

        let query = `
            SELECT 
                it.*,
                ib.batch_number,
                ib.blood_group,
                ib.component,
                u.full_name as performed_by_name
            FROM inventory_transactions it
            JOIN inventory_batches ib ON it.batch_id = ib.id
            JOIN users u ON it.performed_by_user_id = u.id
        `;
        const params = [];

        if (bankId) {
            query += ' WHERE it.blood_bank_id = ?';
            params.push(bankId);
        }

        query += ' ORDER BY it.created_at DESC LIMIT 100';

        const [logs] = await pool.query(query, params);

        return successResponse(res, 'Inventory audit transactions retrieved', logs);
    } catch (err) {
        return errorResponse(res, 'Failed to retrieve inventory audit transactions', 500, err.message);
    }
};
