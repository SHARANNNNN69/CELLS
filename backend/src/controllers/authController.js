import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { successResponse, errorResponse } from '../utils/response.js';
import { logAuditEvent } from '../utils/auditLogger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'cells_jwt_super_secret_dev_key_2026';

export const register = async (req, res) => {
    const { 
        full_name, email, password, phone, role, 
        blood_group, city, state, pincode, 
        organization_name, license_number, address, operating_hours
    } = req.body;

    if (!full_name || !email || !password || !phone) {
        return errorResponse(res, 'Full name, email, password, and phone are required.', 400);
    }

    if (role === 'admin') {
        return errorResponse(res, 'Access denied. Self-registration as Super Administrator is strictly prohibited.', 403);
    }

    const assignedRole = ['donor', 'requester', 'hospital', 'blood_bank', 'public_visitor'].includes(role) 
        ? role 
        : 'public_visitor';

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // Check if email already exists
        const [existing] = await conn.query('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
        if (existing.length > 0) {
            await conn.rollback();
            return errorResponse(res, 'An account with this email address already exists.', 409);
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const [userResult] = await conn.query(
            'INSERT INTO users (full_name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?)',
            [full_name.trim(), email.toLowerCase().trim(), password_hash, phone.trim(), assignedRole]
        );
        const userId = userResult.insertId;

        // Role-specific onboarding profiles
        if (assignedRole === 'donor') {
            await conn.query(
                `INSERT INTO donor_profiles (user_id, blood_group, city, state, pincode, availability_status) 
                 VALUES (?, ?, ?, ?, ?, 'available')`,
                [userId, blood_group || 'O+', city || 'Bangalore', state || 'Karnataka', pincode || '560001']
            );
        } else if (assignedRole === 'hospital') {
            const [hospResult] = await conn.query(
                `INSERT INTO hospitals (name, license_number, address, city, state, pincode, contact_phone, contact_email, verification_status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
                [
                    organization_name || `${full_name}'s Medical Center`,
                    license_number || `HOSP-REG-${Date.now()}`,
                    address || 'City Healthcare Road',
                    city || 'Bangalore',
                    state || 'Karnataka',
                    pincode || '560001',
                    phone,
                    email
                ]
            );
            await conn.query(
                'INSERT INTO hospital_staff (hospital_id, user_id, designation, is_admin_rep) VALUES (?, ?, ?, TRUE)',
                [hospResult.insertId, userId, 'Authorized Representative']
            );
        } else if (assignedRole === 'blood_bank') {
            const [bankResult] = await conn.query(
                `INSERT INTO blood_banks (name, license_number, address, city, state, pincode, contact_phone, contact_email, operating_hours, verification_status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
                [
                    organization_name || `${full_name}'s Blood Center`,
                    license_number || `BB-REG-${Date.now()}`,
                    address || 'Blood Bank Complex',
                    city || 'Bangalore',
                    state || 'Karnataka',
                    pincode || '560001',
                    phone,
                    email,
                    operating_hours || '24/7 Service'
                ]
            );
            await conn.query(
                'INSERT INTO blood_bank_staff (blood_bank_id, user_id, designation, is_manager) VALUES (?, ?, ?, TRUE)',
                [bankResult.insertId, userId, 'Blood Bank Manager']
            );
        }

        await conn.commit();

        await logAuditEvent(userId, 'USER_REGISTERED', 'USER', userId, { role: assignedRole, email }, req);

        const token = jwt.sign(
            { id: userId, email: email.toLowerCase().trim(), role: assignedRole },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return successResponse(res, 'Registration successful', {
            token,
            user: {
                id: userId,
                full_name: full_name.trim(),
                email: email.toLowerCase().trim(),
                phone: phone.trim(),
                role: assignedRole
            }
        }, 201);
    } catch (err) {
        await conn.rollback();
        console.error('Registration Error:', err);
        return errorResponse(res, 'Registration failed due to a server error.', 500, err.message);
    } finally {
        conn.release();
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return errorResponse(res, 'Email and password are required.', 400);
    }

    try {
        const [users] = await pool.query(
            'SELECT id, full_name, email, password_hash, phone, role, is_active FROM users WHERE email = ?',
            [email.toLowerCase().trim()]
        );

        if (users.length === 0) {
            return errorResponse(res, 'Invalid credentials.', 401);
        }

        const user = users[0];

        if (!user.is_active) {
            return errorResponse(res, 'Account has been deactivated or suspended by system administrator.', 403);
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return errorResponse(res, 'Invalid credentials.', 401);
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        await logAuditEvent(user.id, 'USER_LOGIN', 'USER', user.id, { role: user.role }, req);

        return successResponse(res, 'Login successful', {
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                phone: user.phone,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Login Error:', err);
        return errorResponse(res, 'Login failed due to a server error.', 500, err.message);
    }
};

export const getCurrentUser = async (req, res) => {
    try {
        const userId = req.user.id;
        const [users] = await pool.query(
            'SELECT id, full_name, email, phone, role, created_at FROM users WHERE id = ?',
            [userId]
        );

        if (!users.length) {
            return errorResponse(res, 'User not found.', 404);
        }

        const user = users[0];
        let roleDetails = null;

        if (user.role === 'donor') {
            const [donor] = await pool.query('SELECT * FROM donor_profiles WHERE user_id = ?', [userId]);
            roleDetails = donor[0] || null;
        } else if (user.role === 'hospital') {
            const [hosp] = await pool.query(`
                SELECT h.*, hs.designation, hs.is_admin_rep 
                FROM hospitals h
                JOIN hospital_staff hs ON hs.hospital_id = h.id
                WHERE hs.user_id = ?
            `, [userId]);
            roleDetails = hosp[0] || null;
        } else if (user.role === 'blood_bank') {
            const [bb] = await pool.query(`
                SELECT b.*, bs.designation, bs.is_manager 
                FROM blood_banks b
                JOIN blood_bank_staff bs ON bs.blood_bank_id = b.id
                WHERE bs.user_id = ?
            `, [userId]);
            roleDetails = bb[0] || null;
        }

        return successResponse(res, 'Profile retrieved', {
            ...user,
            roleDetails
        });
    } catch (err) {
        return errorResponse(res, 'Failed to fetch user profile.', 500, err.message);
    }
};
