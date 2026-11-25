import pool from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const getMyNotifications = async (req, res) => {
    try {
        const [notifications] = await pool.query(
            'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50',
            [req.user.id]
        );

        return successResponse(res, 'Notifications retrieved', notifications);
    } catch (err) {
        return errorResponse(res, 'Failed to retrieve notifications', 500, err.message);
    }
};

export const markAsRead = async (req, res) => {
    try {
        await pool.query(
            'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.id]
        );
        return successResponse(res, 'Notification marked as read');
    } catch (err) {
        return errorResponse(res, 'Failed to update notification', 500, err.message);
    }
};

export const markAllAsRead = async (req, res) => {
    try {
        await pool.query(
            'UPDATE notifications SET is_read = TRUE WHERE user_id = ?',
            [req.user.id]
        );
        return successResponse(res, 'All notifications marked as read');
    } catch (err) {
        return errorResponse(res, 'Failed to update notifications', 500, err.message);
    }
};
