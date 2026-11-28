import pool from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { logAuditEvent } from '../utils/auditLogger.js';

// Helper to get linked hospital ID for hospital user
const getHospitalIdForUser = async (userId) => {
    const [rows] = await pool.query('SELECT hospital_id FROM hospital_staff WHERE user_id = ?', [userId]);
    return rows.length ? rows[0].hospital_id : null;
};

// Helper to get linked blood bank ID for blood bank user
const getBloodBankIdForUser = async (userId) => {
    const [rows] = await pool.query('SELECT blood_bank_id FROM blood_bank_staff WHERE user_id = ?', [userId]);
    return rows.length ? rows[0].blood_bank_id : null;
};

// GET /api/requests
export const getRequests = async (req, res) => {
    try {
        const { blood_group, urgency, status, city, my_requests } = req.query;

        let query = `
            SELECT 
                r.*,
                u.full_name as requester_name,
                h.name as hospital_name,
                bb.name as assigned_blood_bank_name
            FROM blood_requests r
            JOIN users u ON r.requester_id = u.id
            LEFT JOIN hospitals h ON r.hospital_id = h.id
            LEFT JOIN blood_banks bb ON r.assigned_blood_bank_id = bb.id
            WHERE 1=1
        `;
        const params = [];

        // Role-based filtering when my_requests=true
        if (my_requests === 'true' && req.user) {
            if (req.user.role === 'hospital') {
                const hospitalId = await getHospitalIdForUser(req.user.id);
                query += ' AND r.hospital_id = ?';
                params.push(hospitalId || -1);
            } else if (req.user.role === 'requester') {
                query += ' AND r.requester_id = ?';
                params.push(req.user.id);
            } else if (req.user.role === 'blood_bank') {
                const bankId = await getBloodBankIdForUser(req.user.id);
                query += ' AND (r.assigned_blood_bank_id = ? OR r.status = "pending")';
                params.push(bankId || -1);
            }
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

// GET /api/requests/:id
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
                h.contact_phone as hospital_contact,
                bb.name as assigned_blood_bank_name
            FROM blood_requests r
            JOIN users u ON r.requester_id = u.id
            LEFT JOIN hospitals h ON r.hospital_id = h.id
            LEFT JOIN blood_banks bb ON r.assigned_blood_bank_id = bb.id
            WHERE r.id = ?
        `, [requestId]);

        if (!rows.length) {
            return errorResponse(res, 'Blood request not found', 404);
        }

        const request = rows[0];

        // STRICT RBAC PRIVACY ISOLATION
        if (req.user) {
            // 1. A Hospital cannot access another Hospital's private requests
            if (req.user.role === 'hospital') {
                const myHospitalId = await getHospitalIdForUser(req.user.id);
                if (request.hospital_id && myHospitalId && request.hospital_id !== myHospitalId) {
                    return errorResponse(res, "Access forbidden. A hospital cannot access another hospital's private requests.", 403);
                }
            }

            // 2. A Requestor cannot access another Requestor's private personal information
            if (req.user.role === 'requester' && request.requester_role === 'requester' && request.requester_id !== req.user.id) {
                return errorResponse(res, "Access forbidden. A requestor cannot access another requestor's private request details.", 403);
            }
        }

        // Fetch donor willingness responses
        const [donorInterests] = await pool.query(`
            SELECT di.*, u.full_name as donor_name, dp.blood_group as donor_blood_group
            FROM donor_interests di
            JOIN users u ON di.donor_user_id = u.id
            LEFT JOIN donor_profiles dp ON dp.user_id = u.id
            WHERE di.request_id = ?
            ORDER BY di.created_at DESC
        `, [requestId]);

        request.donorInterests = donorInterests;

        return successResponse(res, 'Request details retrieved', request);
    } catch (err) {
        return errorResponse(res, 'Failed to fetch request detail', 500, err.message);
    }
};

// POST /api/requests (Strictly Hospital or Requester)
export const createRequest = async (req, res) => {
    // RBAC: Only Hospital or Requester can create a blood request
    if (!['hospital', 'requester'].includes(req.user.role)) {
        return errorResponse(
            res, 
            `Access denied. Role '${req.user.role}' cannot create blood requests. Only Hospital / Doctor and Patient / Requester accounts can submit requisitions.`, 
            403
        );
    }

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

        let linkedHospitalId = hospital_id || null;
        let hospName = hospital_name_manual || 'Not specified';

        if (req.user.role === 'hospital') {
            const hId = await getHospitalIdForUser(req.user.id);
            if (hId) {
                linkedHospitalId = hId;
                const [hRow] = await conn.query('SELECT name FROM hospitals WHERE id = ?', [hId]);
                if (hRow.length) hospName = hRow[0].name;
            }
        }

        // Initial status MUST be 'pending'
        const [insertRes] = await conn.query(`
            INSERT INTO blood_requests (
                requester_id, requester_role, patient_name, hospital_id, hospital_name_manual,
                blood_group, component, units_needed, units_fulfilled,
                urgency, required_by, contact_phone, delivery_address,
                city, state, status, processing_stage, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, 'pending', 'none', ?)
        `, [
            req.user.id,
            req.user.role,
            patient_name,
            linkedHospitalId,
            hospName,
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

        // In-app notifications to registered blood banks in the region
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
                `Incoming Blood Requisition (#${requestId}): ${blood_group} ${component || 'Whole Blood'}`,
                `Patient ${patient_name} requires ${units_needed} units at ${hospName}. Status is PENDING review.`,
                `/requests/${requestId}`
            ]);
        }

        await conn.commit();

        await logAuditEvent(req.user.id, 'CREATE_REQUEST', 'REQUEST', requestId, { 
            blood_group, units_needed, urgency, city, role: req.user.role 
        }, req);

        return successResponse(res, 'Blood request created successfully with status PENDING', { id: requestId, status: 'pending' }, 201);
    } catch (err) {
        await conn.rollback();
        return errorResponse(res, 'Failed to create blood request', 500, err.message);
    } finally {
        conn.release();
    }
};

// PATCH /api/requests/:id/accept (Strictly Blood Bank)
export const acceptRequest = async (req, res) => {
    if (req.user.role !== 'blood_bank') {
        return errorResponse(res, "Access denied. Only authorized Blood Bank personnel can accept incoming blood requests.", 403);
    }

    const requestId = req.params.id;
    const bankId = await getBloodBankIdForUser(req.user.id);

    if (!bankId) {
        return errorResponse(res, "User is not linked to an authorized blood bank.", 403);
    }

    try {
        const [rows] = await pool.query('SELECT * FROM blood_requests WHERE id = ?', [requestId]);
        if (!rows.length) return errorResponse(res, 'Request not found', 404);

        const request = rows[0];
        if (request.status !== 'pending') {
            return errorResponse(res, `Cannot accept request with status '${request.status}'. Only PENDING requests can be accepted.`, 400);
        }

        await pool.query(`
            UPDATE blood_requests 
            SET status = 'accepted', assigned_blood_bank_id = ?, processing_stage = 'none' 
            WHERE id = ?
        `, [bankId, requestId]);

        // Notify requester
        await pool.query(`
            INSERT INTO notifications (user_id, title, message, type, link)
            VALUES (?, ?, ?, 'request_update', ?)
        `, [
            request.requester_id,
            `Requisition Accepted (#${requestId})`,
            `Your blood request for ${request.blood_group} has been ACCEPTED by the blood bank and is queued for processing.`,
            `/requests/${requestId}`
        ]);

        await logAuditEvent(req.user.id, 'REQUEST_ACCEPTED', 'REQUEST', requestId, { bankId }, req);

        return successResponse(res, 'Request accepted successfully. Status updated to ACCEPTED.');
    } catch (err) {
        return errorResponse(res, 'Failed to accept request', 500, err.message);
    }
};

// PATCH /api/requests/:id/reject (Strictly Blood Bank)
export const rejectRequest = async (req, res) => {
    if (req.user.role !== 'blood_bank') {
        return errorResponse(res, "Access denied. Only authorized Blood Bank personnel can reject incoming blood requests.", 403);
    }

    const requestId = req.params.id;
    const { reason } = req.body;

    if (!reason) {
        return errorResponse(res, "A valid operational or laboratory reason is required to reject a request.", 400);
    }

    try {
        const [rows] = await pool.query('SELECT * FROM blood_requests WHERE id = ?', [requestId]);
        if (!rows.length) return errorResponse(res, 'Request not found', 404);

        const request = rows[0];
        if (!['pending', 'accepted'].includes(request.status)) {
            return errorResponse(res, `Cannot reject request with status '${request.status}'.`, 400);
        }

        await pool.query(`
            UPDATE blood_requests 
            SET status = 'rejected', rejection_reason = ?
            WHERE id = ?
        `, [reason, requestId]);

        // Notify requester
        await pool.query(`
            INSERT INTO notifications (user_id, title, message, type, link)
            VALUES (?, ?, ?, 'request_update', ?)
        `, [
            request.requester_id,
            `Requisition Rejected (#${requestId})`,
            `Your blood request could not be fulfilled: ${reason}`,
            `/requests/${requestId}`
        ]);

        await logAuditEvent(req.user.id, 'REQUEST_REJECTED', 'REQUEST', requestId, { reason }, req);

        return successResponse(res, 'Request rejected. Status updated to REJECTED.');
    } catch (err) {
        return errorResponse(res, 'Failed to reject request', 500, err.message);
    }
};

// PATCH /api/requests/:id/process (Strictly Blood Bank)
export const processRequest = async (req, res) => {
    if (req.user.role !== 'blood_bank') {
        return errorResponse(res, "Access denied. Only authorized Blood Bank personnel can update processing stage.", 403);
    }

    const requestId = req.params.id;
    const bankId = await getBloodBankIdForUser(req.user.id);

    try {
        const [rows] = await pool.query('SELECT * FROM blood_requests WHERE id = ?', [requestId]);
        if (!rows.length) return errorResponse(res, 'Request not found', 404);

        const request = rows[0];
        if (request.assigned_blood_bank_id !== bankId && req.user.role !== 'admin') {
            return errorResponse(res, "Access denied. This request is assigned to a different blood bank.", 403);
        }

        await pool.query(`
            UPDATE blood_requests 
            SET status = 'processing', processing_stage = 'stock_reserved'
            WHERE id = ?
        `, [requestId]);

        // Notify requester
        await pool.query(`
            INSERT INTO notifications (user_id, title, message, type, link)
            VALUES (?, ?, ?, 'request_update', ?)
        `, [
            request.requester_id,
            `Requisition Processing (#${requestId})`,
            `Blood units are being prepared and reserved at the blood bank for patient ${request.patient_name}.`,
            `/requests/${requestId}`
        ]);

        await logAuditEvent(req.user.id, 'REQUEST_PROCESSING', 'REQUEST', requestId, {}, req);

        return successResponse(res, 'Request updated to PROCESSING (stock reserved).');
    } catch (err) {
        return errorResponse(res, 'Failed to update processing status', 500, err.message);
    }
};

// PATCH /api/requests/:id/dispatch (Strictly Blood Bank)
export const dispatchRequest = async (req, res) => {
    if (req.user.role !== 'blood_bank') {
        return errorResponse(res, "Access denied. Only authorized Blood Bank personnel can dispatch blood units.", 403);
    }

    const requestId = req.params.id;
    const bankId = await getBloodBankIdForUser(req.user.id);

    try {
        const [rows] = await pool.query('SELECT * FROM blood_requests WHERE id = ?', [requestId]);
        if (!rows.length) return errorResponse(res, 'Request not found', 404);

        const request = rows[0];
        if (request.assigned_blood_bank_id !== bankId && req.user.role !== 'admin') {
            return errorResponse(res, "Access denied. This request is assigned to a different blood bank.", 403);
        }

        await pool.query(`
            UPDATE blood_requests 
            SET status = 'dispatched', processing_stage = 'dispatched'
            WHERE id = ?
        `, [requestId]);

        // Notify requester
        await pool.query(`
            INSERT INTO notifications (user_id, title, message, type, link)
            VALUES (?, ?, ?, 'request_update', ?)
        `, [
            request.requester_id,
            `Blood Dispatched (#${requestId})`,
            `Blood units have been dispatched from the blood bank to ${request.hospital_name_manual || request.delivery_address}.`,
            `/requests/${requestId}`
        ]);

        await logAuditEvent(req.user.id, 'REQUEST_DISPATCHED', 'REQUEST', requestId, {}, req);

        return successResponse(res, 'Blood units marked as DISPATCHED.');
    } catch (err) {
        return errorResponse(res, 'Failed to dispatch blood', 500, err.message);
    }
};

// PATCH /api/requests/:id/fulfill (Atomic Stock Deduction & Completion)
export const fulfillRequest = async (req, res) => {
    if (req.user.role !== 'blood_bank' && req.user.role !== 'admin') {
        return errorResponse(res, 'Access denied. Only authorized Blood Bank personnel can issue blood inventory.', 403);
    }

    const requestId = req.params.id;
    const { batch_id, units_to_deduct } = req.body;

    if (!batch_id || !units_to_deduct || units_to_deduct <= 0) {
        return errorResponse(res, 'Batch ID and valid units to deduct (>0) are required.', 400);
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1. Lock the inventory batch FOR UPDATE
        const [batchRows] = await conn.query(
            'SELECT * FROM inventory_batches WHERE id = ? FOR UPDATE',
            [batch_id]
        );

        if (!batchRows.length) {
            await conn.rollback();
            return errorResponse(res, 'Inventory batch not found.', 404);
        }

        const batch = batchRows[0];

        // STRICT OWNERSHIP CHECK: Blood bank can only deduct from its own bank inventory!
        const bankId = await getBloodBankIdForUser(req.user.id);
        if (req.user.role === 'blood_bank' && batch.blood_bank_id !== bankId) {
            await conn.rollback();
            return errorResponse(res, "Access forbidden. A blood bank cannot modify another blood bank's inventory.", 403);
        }

        // Safety rules
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

        // Deduct units
        const newAvailable = batch.units_available - units_to_deduct;
        const newStatus = newAvailable === 0 ? 'depleted' : 'tested_safe';

        await conn.query(
            'UPDATE inventory_batches SET units_available = ?, status = ? WHERE id = ?',
            [newAvailable, newStatus, batch_id]
        );

        // Record immutable audit transaction
        await conn.query(`
            INSERT INTO inventory_transactions (
                batch_id, blood_bank_id, change_units, transaction_type, reference_request_id, reason, performed_by_user_id
            ) VALUES (?, ?, ?, 'fulfillment', ?, ?, ?)
        `, [
            batch_id,
            batch.blood_bank_id,
            -units_to_deduct,
            requestId,
            `Units issued for Blood Requisition #${requestId}`,
            req.user.id
        ]);

        // Update request progress and mark completed if all units fulfilled
        const [reqRows] = await conn.query(
            'SELECT * FROM blood_requests WHERE id = ? FOR UPDATE',
            [requestId]
        );

        if (reqRows.length) {
            const newFulfilled = reqRows[0].units_fulfilled + units_to_deduct;
            const updatedReqStatus = newFulfilled >= reqRows[0].units_needed ? 'completed' : 'processing';
            const updatedStage = newFulfilled >= reqRows[0].units_needed ? 'completed' : 'stock_reserved';

            await conn.query(
                `UPDATE blood_requests 
                 SET units_fulfilled = ?, status = ?, processing_stage = ?, assigned_blood_bank_id = COALESCE(assigned_blood_bank_id, ?)
                 WHERE id = ?`,
                [newFulfilled, updatedReqStatus, updatedStage, batch.blood_bank_id, requestId]
            );

            // Notify requester of completion
            if (updatedReqStatus === 'completed') {
                await conn.query(`
                    INSERT INTO notifications (user_id, title, message, type, link)
                    VALUES (?, ?, ?, 'request_update', ?)
                `, [
                    reqRows[0].requester_id,
                    `Requisition Completed (#${requestId})`,
                    `All ${reqRows[0].units_needed} units have been successfully issued and delivered for patient ${reqRows[0].patient_name}.`,
                    `/requests/${requestId}`
                ]);
            }
        }

        await conn.commit();

        await logAuditEvent(req.user.id, 'STOCK_FULFILLMENT', 'INVENTORY', batch_id, {
            requestId,
            unitsDeducted: units_to_deduct,
            remainingUnits: newAvailable
        }, req);

        return successResponse(res, 'Units successfully issued and request fulfilled.', {
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

// PATCH /api/requests/:id/cancel (Strictly original Requester / Hospital)
export const cancelRequest = async (req, res) => {
    const requestId = req.params.id;

    try {
        const [rows] = await pool.query('SELECT * FROM blood_requests WHERE id = ?', [requestId]);
        if (!rows.length) return errorResponse(res, 'Request not found', 404);

        const request = rows[0];

        // Only original requester or admin can cancel
        let isAuthorized = (request.requester_id === req.user.id) || (req.user.role === 'admin');

        // If submitted by hospital, other staff from same hospital can cancel
        if (!isAuthorized && req.user.role === 'hospital' && request.hospital_id) {
            const userHospId = await getHospitalIdForUser(req.user.id);
            if (userHospId === request.hospital_id) isAuthorized = true;
        }

        if (!isAuthorized) {
            return errorResponse(res, 'Access denied. You can only cancel your own pending requests.', 403);
        }

        // Only PENDING requests are eligible for cancellation
        if (request.status !== 'pending') {
            return errorResponse(res, `Cannot cancel request. Status is '${request.status}'. Only PENDING requests can be cancelled.`, 400);
        }

        await pool.query('UPDATE blood_requests SET status = "cancelled" WHERE id = ?', [requestId]);

        await logAuditEvent(req.user.id, 'CANCEL_REQUEST', 'REQUEST', requestId, {}, req);

        return successResponse(res, 'Request cancelled successfully.');
    } catch (err) {
        return errorResponse(res, 'Failed to cancel request', 500, err.message);
    }
};

// POST /api/requests/:id/donor-interest (Strictly Donor)
export const expressDonorInterest = async (req, res) => {
    if (req.user.role !== 'donor') {
        return errorResponse(res, "Access denied. Only registered Donor accounts can express willingness to donate.", 403);
    }

    const requestId = req.params.id;
    const { availability_note } = req.body;

    try {
        const [rows] = await pool.query('SELECT * FROM blood_requests WHERE id = ?', [requestId]);
        if (!rows.length) return errorResponse(res, 'Request not found', 404);

        const request = rows[0];

        // Check if already expressed
        const [existing] = await pool.query(
            'SELECT id FROM donor_interests WHERE request_id = ? AND donor_user_id = ?',
            [requestId, req.user.id]
        );

        if (existing.length) {
            return errorResponse(res, 'You have already expressed willingness to donate for this requisition.', 409);
        }

        const [insertRes] = await pool.query(`
            INSERT INTO donor_interests (request_id, donor_user_id, availability_note, status)
            VALUES (?, ?, ?, 'expressed')
        `, [requestId, req.user.id, availability_note || 'Available to donate upon clinical screening']);

        // Notify requester
        await pool.query(`
            INSERT INTO notifications (user_id, title, message, type, link)
            VALUES (?, ?, ?, 'request_update', ?)
        `, [
            request.requester_id,
            `Donor Willingness Received (#${requestId})`,
            `A voluntary donor (${req.user.full_name}) has expressed willingness to donate for patient ${request.patient_name}.`,
            `/requests/${requestId}`
        ]);

        await logAuditEvent(req.user.id, 'DONOR_INTEREST_EXPRESSED', 'DONOR_INTEREST', insertRes.insertId, { requestId }, req);

        return successResponse(res, 'Willingness to donate recorded. The blood bank will coordinate screening.', { id: insertRes.insertId });
    } catch (err) {
        return errorResponse(res, 'Failed to record donation willingness', 500, err.message);
    }
};
