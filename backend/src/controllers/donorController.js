import pool from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';

// Get donors with privacy masking (phone masked unless requested through sanctioned flow)
export const getDonors = async (req, res) => {
    try {
        const { blood_group, city, status } = req.query;

        let query = `
            SELECT 
                dp.id,
                dp.user_id,
                CONCAT(SUBSTRING(u.full_name, 1, 1), '*** ', SUBSTRING(u.full_name, LOCATE(' ', u.full_name) + 1, 1), '***') AS masked_name,
                dp.blood_group,
                dp.city,
                dp.state,
                dp.last_donation_date,
                dp.availability_status,
                dp.contact_preference,
                -- Informational only flag
                CASE 
                    WHEN dp.last_donation_date IS NULL THEN TRUE
                    WHEN DATEDIFF(CURDATE(), dp.last_donation_date) >= 90 THEN TRUE
                    ELSE FALSE
                END AS informational_interval_eligible
            FROM donor_profiles dp
            JOIN users u ON dp.user_id = u.id
            WHERE u.is_active = TRUE
        `;
        const params = [];

        if (blood_group) {
            query += ' AND dp.blood_group = ?';
            params.push(blood_group);
        }

        if (city) {
            query += ' AND dp.city LIKE ?';
            params.push(`%${city}%`);
        }

        if (status) {
            query += ' AND dp.availability_status = ?';
            params.push(status);
        }

        query += ' ORDER BY dp.last_donation_date ASC, dp.id DESC';

        const [donors] = await pool.query(query, params);

        return successResponse(res, 'Preliminary potential donor leads retrieved', {
            disclaimer: 'Informational only. Self-reported records do not establish medical eligibility or transfusion compatibility. Clinical verification by licensed blood bank is mandatory.',
            count: donors.length,
            donors
        });
    } catch (err) {
        return errorResponse(res, 'Failed to retrieve donors', 500, err.message);
    }
};

export const getMyProfile = async (req, res) => {
    try {
        const [profile] = await pool.query(`
            SELECT dp.*, u.full_name, u.email, u.phone 
            FROM donor_profiles dp
            JOIN users u ON dp.user_id = u.id
            WHERE dp.user_id = ?
        `, [req.user.id]);

        if (!profile.length) {
            return errorResponse(res, 'Donor profile not found', 404);
        }

        return successResponse(res, 'Donor profile retrieved', profile[0]);
    } catch (err) {
        return errorResponse(res, 'Failed to fetch donor profile', 500, err.message);
    }
};

export const updateMyProfile = async (req, res) => {
    const { blood_group, city, state, pincode, last_donation_date, availability_status, contact_preference, notes } = req.body;

    try {
        await pool.query(`
            UPDATE donor_profiles 
            SET 
                blood_group = COALESCE(?, blood_group),
                city = COALESCE(?, city),
                state = COALESCE(?, state),
                pincode = COALESCE(?, pincode),
                last_donation_date = COALESCE(?, last_donation_date),
                availability_status = COALESCE(?, availability_status),
                contact_preference = COALESCE(?, contact_preference),
                notes = COALESCE(?, notes)
            WHERE user_id = ?
        `, [blood_group, city, state, pincode, last_donation_date, availability_status, contact_preference, notes, req.user.id]);

        return successResponse(res, 'Donor profile updated successfully');
    } catch (err) {
        return errorResponse(res, 'Failed to update donor profile', 500, err.message);
    }
};

export const getDonationHistory = async (req, res) => {
    try {
        const [history] = await pool.query(`
            SELECT d.*, b.name as blood_bank_name, b.city as blood_bank_city
            FROM donations d
            JOIN blood_banks b ON d.blood_bank_id = b.id
            WHERE d.donor_user_id = ?
            ORDER BY d.donation_date DESC
        `, [req.user.id]);

        return successResponse(res, 'Donation history retrieved', history);
    } catch (err) {
        return errorResponse(res, 'Failed to retrieve donation history', 500, err.message);
    }
};
