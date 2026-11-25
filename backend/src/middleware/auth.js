import jwt from 'jsonwebtoken';
import { errorResponse } from '../utils/response.js';
import pool from '../config/db.js';

export const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return errorResponse(res, 'Access denied. Authentication token missing.', 401);
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cells_jwt_super_secret_dev_key_2026');
        
        // Confirm user still exists and is active
        const [rows] = await pool.query(
            'SELECT id, full_name, email, phone, role, is_active FROM users WHERE id = ?',
            [decoded.id]
        );

        if (!rows.length || !rows[0].is_active) {
            return errorResponse(res, 'User session invalid or account suspended.', 401);
        }

        req.user = rows[0];
        next();
    } catch (err) {
        return errorResponse(res, 'Invalid or expired token.', 403);
    }
};

export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return errorResponse(res, 'Unauthorized.', 401);
        }

        if (!roles.includes(req.user.role)) {
            return errorResponse(
                res, 
                `Access forbidden. Role '${req.user.role}' lacks permission for this resource.`, 
                403
            );
        }

        next();
    };
};
