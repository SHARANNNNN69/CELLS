import pool from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';

export const getBloodBanks = async (req, res) => {
    try {
        const { city, blood_group, component, verification_status } = req.query;

        let query = `
            SELECT 
                b.id,
                b.name,
                b.license_number,
                b.address,
                b.city,
                b.state,
                b.pincode,
                b.latitude,
                b.longitude,
                b.contact_phone,
                b.contact_email,
                b.operating_hours,
                b.verification_status,
                -- Total available stock count (only tested_safe and non-expired)
                COALESCE(SUM(
                    CASE 
                        WHEN ib.status = 'tested_safe' AND ib.expiry_date >= CURDATE() 
                        ${blood_group ? `AND ib.blood_group = ${pool.escape(blood_group)}` : ''}
                        ${component ? `AND ib.component = ${pool.escape(component)}` : ''}
                        THEN ib.units_available 
                        ELSE 0 
                    END
                ), 0) AS total_tested_units
            FROM blood_banks b
            LEFT JOIN inventory_batches ib ON b.id = ib.blood_bank_id
            WHERE 1=1
        `;
        const params = [];

        if (verification_status) {
            query += ' AND b.verification_status = ?';
            params.push(verification_status);
        } else {
            // Default to verified banks for public search
            query += " AND b.verification_status = 'verified'";
        }

        if (city) {
            query += ' AND b.city LIKE ?';
            params.push(`%${city}%`);
        }

        query += ' GROUP BY b.id ORDER BY total_tested_units DESC, b.name ASC';

        const [banks] = await pool.query(query, params);

        return successResponse(res, 'Blood banks retrieved', {
            disclaimer: 'Reported / Demo availability. Physical crossmatch & clinical verification required.',
            banks
        });
    } catch (err) {
        return errorResponse(res, 'Failed to fetch blood banks', 500, err.message);
    }
};

export const getBloodBankById = async (req, res) => {
    try {
        const bankId = req.params.id;

        const [rows] = await pool.query('SELECT * FROM blood_banks WHERE id = ?', [bankId]);
        if (!rows.length) {
            return errorResponse(res, 'Blood bank not found', 404);
        }

        const bank = rows[0];

        // Component & blood group availability breakdown
        const [inventorySummary] = await pool.query(`
            SELECT 
                blood_group,
                component,
                SUM(units_available) as available_units
            FROM inventory_batches
            WHERE blood_bank_id = ? AND status = 'tested_safe' AND expiry_date >= CURDATE()
            GROUP BY blood_group, component
            ORDER BY blood_group, component
        `, [bankId]);

        bank.inventory = inventorySummary;

        return successResponse(res, 'Blood bank details retrieved', bank);
    } catch (err) {
        return errorResponse(res, 'Failed to fetch blood bank detail', 500, err.message);
    }
};
