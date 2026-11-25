import pool from '../config/db.js';

export const logAuditEvent = async (userId, action, entityType, entityId, details, req = null) => {
    try {
        const ip = req ? (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1') : '127.0.0.1';
        const detailsJson = details ? JSON.stringify(details) : null;
        
        await pool.query(
            'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details_json, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
            [userId || null, action, entityType, entityId || null, detailsJson, ip]
        );
    } catch (err) {
        console.error('Audit logging error:', err.message);
    }
};
