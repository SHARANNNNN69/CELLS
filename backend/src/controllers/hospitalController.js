import pool from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const getHospitals = async (req, res) => {
    try {
        const { city, verification_status } = req.query;

        let query = 'SELECT * FROM hospitals WHERE 1=1';
        const params = [];

        if (verification_status) {
            query += ' AND verification_status = ?';
            params.push(verification_status);
        } else {
            query += " AND verification_status = 'verified'";
        }

        if (city) {
            query += ' AND city LIKE ?';
            params.push(`%${city}%`);
        }

        query += ' ORDER BY name ASC';

        const [hospitals] = await pool.query(query, params);
        return successResponse(res, 'Hospitals retrieved', hospitals);
    } catch (err) {
        return errorResponse(res, 'Failed to fetch hospitals', 500, err.message);
    }
};

export const getMyHospital = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT h.*, hs.designation, hs.is_admin_rep
            FROM hospitals h
            JOIN hospital_staff hs ON hs.hospital_id = h.id
            WHERE hs.user_id = ?
        `, [req.user.id]);

        if (!rows.length) {
            return errorResponse(res, 'Hospital profile not associated with this account', 404);
        }

        return successResponse(res, 'Hospital profile retrieved', rows[0]);
    } catch (err) {
        return errorResponse(res, 'Failed to fetch hospital details', 500, err.message);
    }
};
