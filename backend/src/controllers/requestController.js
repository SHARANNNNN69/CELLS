import pool from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { logAuditEvent } from '../utils/auditLogger.js';

export const getRequests = async (req, res) => {
    try {
        const { blood_group, urgency, status, city, my_requests } = req.query;

        let query = `
            SELECT 
                r.*,
                u.full_name as requester_name,
                h.name as hospital_name
            FROM blood_requests r
            JOIN users u ON r.requester_id = u.id
            LEFT JOIN hospitals h ON r.hospital_id = h.id
            WHERE 1=1
        `;
        const params = [];

        if (my_requests === 'true' && req.user) {
            query += ' AND r.requester_id = ?';
            params.push(req.user.id);
        }

        if (blood_group) {
            query += ' AND r.blood_group = ?';
            params.push(blood_group);
        }

        if (urgency) {
            query += ' AND r.urgency = ?';
            params.push(urgency);
        }

        if (status) {
            query += ' AND r.status = ?';
            params.push(status);
        }

        if (city) {
            query += ' AND r.city LIKE ?';
            params.push(`%${city}%`);
        }

        query += ` ORDER BY 
            CASE r.urgency 
                WHEN 'emergency' THEN 1 
                WHEN 'urgent' THEN 2 
                ELSE 3 
            END,
            r.created_at DESC
        `;

        const [requests] = await pool.query(query, params);

        return successResponse(res, 'Blood requests retrieved', requests);
    } catch (err) {
        return errorResponse(res, 'Failed to fetch blood requests', 500, err.message);
    }
};

export const getRequestById = async (req, res) => {
    try {
        const requestId = req.params.id;

        const [rows] = await pool.query(`
            SELECT 
                r.*,
                u.full_name as requester_name,
                u.email as requester_email,
                h.name as hospital_name,
                h.address as hospital_address,
                h.contact_phone as hospital_contact
            FROM blood_requests r
            JOIN users u ON r.requester_id = u.id
            LEFT JOIN hospitals h ON r.hospital_id = h.id
            WHERE r.id = ?
        `, [requestId]);

        if (!rows.length) {
            return errorResponse(res, 'Blood request not found', 404);
        }

        const request = rows[0];

        // Fetch responses
        const [responses] = await pool.query(`
            SELECT rr.* 
            FROM request_responses rr
            WHERE rr.request_id = ?
            ORDER BY rr.created_at DESC
        `, [requestId]);

        request.responses = responses;

        return successResponse(res, 'Request details retrieved', request);
    } catch (err) {
        return errorResponse(res, 'Failed to fetch request detail', 500, err.message);
    }
};

export const createRequest = async (req, res) => {
    const {
        patient_name,
        hospital_id,
        hospital_name_manual,
        blood_group,
        component,
        units_needed,
        urgency,
        required_by,
        contact_phone,
        delivery_address,
        city,
        state,
        notes
    } = req.body;

    if (!patient_name || !blood_group || !units_needed || !required_by || !contact_phone || !delivery_address || !city) {
        return errorResponse(res, 'Required fields missing: patient_name, blood_group, units_needed, required_by, contact_phone, delivery_address, city.', 400);
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [insertRes] = await conn.query(`
            INSERT INTO blood_requests (
                requester_id, patient_name, hospital_id, hospital_name_manual,
                blood_group, component, units_needed, units_fulfilled,
                urgency, required_by, contact_phone, delivery_address,
                city, state, status, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, 'open', ?)
        `, [
            req.user.id,
            patient_name,
            hospital_id || null,
            hospital_name_manual || 'Not specified',
            blood_group,
            component || 'Whole Blood',
            units_needed,
            urgency || 'standard',
            required_by,
            contact_phone,
            delivery_address,
            city,
            state || 'Karnataka',
            notes || null
        ]);

        const requestId = insertRes.insertId;

        // If emergency or urgent, dispatch in-app notifications to matching blood bank staff and nearby donors
        if (urgency === 'emergency' || urgency === 'urgent') {
            // 1. Notify blood bank staff
            const [banks] = await conn.query(`
                SELECT bs.user_id 
                FROM blood_bank_staff bs
                JOIN blood_banks b ON bs.blood_bank_id = b.id
                WHERE b.city LIKE ?
            `, [`%${city}%`]);

            for (const b of banks) {
                await conn.query(`
                    INSERT INTO notifications (user_id, title, message, type, link)
                    VALUES (?, ?, ?, 'emergency', ?)
                `, [
                    b.user_id,
                    `🚨 ${urgency.toUpperCase()} Blood Alert: ${blood_group} (${component || 'Whole Blood'})`,
                    `Patient ${patient_name} requires ${units_needed} units urgently at ${hospital_name_manual || city}.`,
                    `/requests/${requestId}`
                ]);
            }

            // 2. Notify matching donors in same city
            const [donors] = await conn.query(`
                SELECT dp.user_id
                FROM donor_profiles dp
                WHERE dp.blood_group = ? AND dp.city LIKE ? AND dp.availability_status = 'available'
            `, [blood_group, `%${city}%`]);

            for (const d of donors) {
                await conn.query(`
                    INSERT INTO notifications (user_id, title, message, type, link)
                    VALUES (?, ?, ?, 'emergency', ?)
                `, [
                    d.user_id,
                    `Urgent Donor Alert: ${blood_group} Blood Needed`,
                    `An urgent request for ${blood_group} has been opened in ${city}. Your voluntary support may save a life.`,
                    `/requests/${requestId}`
                ]);
            }
        }

        await conn.commit();

        await logAuditEvent(req.user.id, 'CREATE_REQUEST', 'REQUEST', requestId, { blood_group, units_needed, urgency, city }, req);

        return successResponse(res, 'Blood request created successfully', { id: requestId }, 201);
    } catch (err) {
        await conn.rollback();
        return errorResponse(res, 'Failed to create blood request', 500, err.message);
    } finally {
        conn.release();
    }
};

export const cancelRequest = async (req, res) => {
    const requestId = req.params.id;

    try {
        const [rows] = await pool.query('SELECT * FROM blood_requests WHERE id = ?', [requestId]);
        if (!rows.length) {
            return errorResponse(res, 'Request not found', 404);
        }

        const request = rows[0];

        // Only owner or admin can cancel
        if (request.requester_id !== req.user.id && req.user.role !== 'admin') {
            return errorResponse(res, 'Permission denied. Only the original requester or admin can cancel this request.', 403);
        }

        if (request.status === 'fulfilled' || request.status === 'cancelled') {
            return errorResponse(res, `Cannot cancel a request that is already ${request.status}.`, 400);
        }

        await pool.query('UPDATE blood_requests SET status = "cancelled" WHERE id = ?', [requestId]);

        await logAuditEvent(req.user.id, 'CANCEL_REQUEST', 'REQUEST', requestId, {}, req);

        return successResponse(res, 'Request cancelled successfully');
    } catch (err) {
        return errorResponse(res, 'Failed to cancel request', 500, err.message);
    }
};

export const respondToRequest = async (req, res) => {
    const requestId = req.params.id;
    const { units_offered, message } = req.body;

    try {
        const [rows] = await pool.query('SELECT * FROM blood_requests WHERE id = ?', [requestId]);
        if (!rows.length) {
            return errorResponse(res, 'Request not found', 404);
        }

        let responderType = 'donor';
        let responderId = req.user.id;
        let responderName = req.user.full_name;

        if (req.user.role === 'blood_bank') {
            const [bb] = await pool.query('SELECT blood_bank_id FROM blood_bank_staff WHERE user_id = ?', [req.user.id]);
            if (bb.length) {
                responderType = 'blood_bank';
                responderId = bb[0].blood_bank_id;
                const [bName] = await pool.query('SELECT name FROM blood_banks WHERE id = ?', [responderId]);
                if (bName.length) responderName = bName[0].name;
            }
        }

        const [insertRes] = await pool.query(`
            INSERT INTO request_responses (
                request_id, responder_type, responder_id, responder_name, units_offered, status, message
            ) VALUES (?, ?, ?, ?, ?, 'offered', ?)
        `, [
            requestId,
            responderType,
            responderId,
            responderName,
            units_offered || 1,
            message || 'We are prepared to coordinate for this unit request.'
        ]);

        // Send in-app notification to requester
        await pool.query(`
            INSERT INTO notifications (user_id, title, message, type, link)
            VALUES (?, ?, ?, 'request_update', ?)
        `, [
            rows[0].requester_id,
            `Response Received for Request #${requestId}`,
            `${responderName} offered ${units_offered || 1} units for your request.`,
            `/requests/${requestId}`
        ]);

        return successResponse(res, 'Response submitted successfully', { id: insertRes.insertId });
    } catch (err) {
        return errorResponse(res, 'Failed to record response', 500, err.message);
    }
};

// ATOMIC STOCK FULFILLMENT WITH DATABASE TRANSACTIONS
export const fulfillRequest = async (req, res) => {
    const requestId = req.params.id;
    const { batch_id, units_to_deduct } = req.body;

    if (!batch_id || !units_to_deduct || units_to_deduct <= 0) {
        return errorResponse(res, 'Batch ID and valid units to deduct (>0) are required.', 400);
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Lock the inventory batch FOR UPDATE to prevent race-condition overbooking
        const [batchRows] = await conn.query(
            'SELECT * FROM inventory_batches WHERE id = ? FOR UPDATE',
            [batch_id]
        );

        if (!batchRows.length) {
            await conn.rollback();
            return errorResponse(res, 'Inventory batch not found.', 404);
        }

        const batch = batchRows[0];

        // Verify blood bank authority
        if (req.user.role === 'blood_bank') {
            const [staff] = await conn.query(
                'SELECT blood_bank_id FROM blood_bank_staff WHERE user_id = ? AND blood_bank_id = ?',
                [req.user.id, batch.blood_bank_id]
            );
            if (!staff.length) {
                await conn.rollback();
                return errorResponse(res, 'Unauthorized to deduct from this blood bank inventory.', 403);
            }
        }

        // Safety rules: Do not deduct expired, quarantined or depleted stock
        if (batch.status !== 'tested_safe') {
            await conn.rollback();
            return errorResponse(res, `Cannot deduct stock from batch with status '${batch.status}'. Only 'tested_safe' batches can be issued.`, 400);
        }

        if (new Date(batch.expiry_date) < new Date()) {
            await conn.rollback();
            return errorResponse(res, 'Cannot fulfill with expired batch.', 400);
        }

        if (batch.units_available < units_to_deduct) {
            await conn.rollback();
            return errorResponse(res, `Insufficient stock in batch. Available: ${batch.units_available}, Requested: ${units_to_deduct}`, 400);
        }

        // 2. Deduct units and update batch status if depleted
        const newAvailable = batch.units_available - units_to_deduct;
        const newStatus = newAvailable === 0 ? 'depleted' : 'tested_safe';

        await conn.query(
            'UPDATE inventory_batches SET units_available = ?, status = ? WHERE id = ?',
            [newAvailable, newStatus, batch_id]
        );

        // 3. Record audit transaction
        await conn.query(`
            INSERT INTO inventory_transactions (
                batch_id, blood_bank_id, change_units, transaction_type, reference_request_id, reason, performed_by_user_id
            ) VALUES (?, ?, ?, 'fulfillment', ?, ?, ?)
        `, [
            batch_id,
            batch.blood_bank_id,
            -units_to_deduct,
            requestId,
            `Units issued to fulfill Blood Request #${requestId}`,
            req.user.id
        ]);

        // 4. Update request progress
        const [reqRows] = await conn.query(
            'SELECT units_needed, units_fulfilled FROM blood_requests WHERE id = ? FOR UPDATE',
            [requestId]
        );

        if (reqRows.length) {
            const newFulfilled = reqRows[0].units_fulfilled + units_to_deduct;
            const updatedReqStatus = newFulfilled >= reqRows[0].units_needed ? 'fulfilled' : 'partially_fulfilled';

            await conn.query(
                'UPDATE blood_requests SET units_fulfilled = ?, status = ? WHERE id = ?',
                [newFulfilled, updatedReqStatus, requestId]
            );
        }

        await conn.commit();

        await logAuditEvent(req.user.id, 'STOCK_FULFILLMENT', 'INVENTORY', batch_id, {
            requestId,
            unitsDeducted: units_to_deduct,
            remainingUnits: newAvailable
        }, req);

        return successResponse(res, 'Stock successfully allocated and request updated.', {
            remainingBatchUnits: newAvailable,
            unitsDeducted: units_to_deduct
        });
    } catch (err) {
        await conn.rollback();
        console.error('Fulfillment error:', err);
        return errorResponse(res, 'Transaction failed to complete stock deduction', 500, err.message);
    } finally {
        conn.release();
    }
};
