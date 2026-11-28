import bcrypt from 'bcryptjs';
import pool from '../src/config/db.js';

async function seed() {
    console.log('--- Starting CELLS Database Seeding (Strict RBAC & Workflows) ---');
    const conn = await pool.getConnection();

    try {
        await conn.beginTransaction();

        // 1. Clear existing seed data in reverse dependency order
        console.log('Clearing existing records...');
        await conn.query('SET FOREIGN_KEY_CHECKS = 0');
        await conn.query('TRUNCATE TABLE audit_logs');
        await conn.query('TRUNCATE TABLE notifications');
        await conn.query('TRUNCATE TABLE donations');
        await conn.query('TRUNCATE TABLE inventory_transactions');
        await conn.query('TRUNCATE TABLE inventory_batches');
        await conn.query('TRUNCATE TABLE donor_interests');
        await conn.query('TRUNCATE TABLE blood_requests');
        await conn.query('TRUNCATE TABLE blood_bank_staff');
        await conn.query('TRUNCATE TABLE blood_banks');
        await conn.query('TRUNCATE TABLE hospital_staff');
        await conn.query('TRUNCATE TABLE hospitals');
        await conn.query('TRUNCATE TABLE donor_profiles');
        await conn.query('TRUNCATE TABLE users');
        await conn.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log('Creating demo users for each role...');
        const salt = await bcrypt.genSalt(10);
        const passAdmin = await bcrypt.hash('Admin@1234', salt);
        const passBank = await bcrypt.hash('Bank@1234', salt);
        const passHosp = await bcrypt.hash('Hosp@1234', salt);
        const passDonor = await bcrypt.hash('Donor@1234', salt);
        const passReq = await bcrypt.hash('Req@1234', salt);
        const passVisitor = await bcrypt.hash('Visit@1234', salt);

        // Seed Users
        const usersData = [
            // [id, full_name, email, password_hash, phone, role]
            [1, 'System Administrator', 'admin@cells.org', passAdmin, '+91-9876543210', 'admin'],
            [2, 'Dr. Sarah Mathews (Metro Bank)', 'staff@metroblood.org', passBank, '+91-9876543211', 'blood_bank'],
            [3, 'Dr. Arvind Verma (CityCare)', 'doctor@citycare.org', passHosp, '+91-9876543212', 'hospital'],
            [4, 'Rajesh Kumar (Demo Donor)', 'donor.rajesh@cells.sample', passDonor, '+91-9876543213', 'donor'],
            [5, 'Priya Sharma (Demo Donor)', 'donor.priya@cells.sample', passDonor, '+91-9876543214', 'donor'],
            [6, 'Amit Sengupta (Demo Requester)', 'requester.amit@cells.sample', passReq, '+91-9876543215', 'requester'],
            [7, 'Kavita Nair (Demo Visitor)', 'visitor.demo@cells.sample', passVisitor, '+91-9876543216', 'public_visitor'],
            [8, 'Anil Kulkarni (Apollo Bank)', 'staff@apollobank.org', passBank, '+91-9876543217', 'blood_bank'],
            [9, 'Dr. Meera Nambiar (St. Jude)', 'doctor@stjude.org', passHosp, '+91-9876543218', 'hospital']
        ];

        for (const u of usersData) {
            await conn.query(
                'INSERT INTO users (id, full_name, email, password_hash, phone, role) VALUES (?, ?, ?, ?, ?, ?)',
                u
            );
        }

        // Seed Donor Profiles
        console.log('Seeding donor profiles...');
        await conn.query(`
            INSERT INTO donor_profiles (user_id, blood_group, city, state, pincode, last_donation_date, availability_status, contact_preference, notes)
            VALUES 
            (4, 'O+', 'Bangalore', 'Karnataka', '560001', '2026-08-10', 'available', 'in_app', 'Regular voluntary donor. Universal red cell donor for positive types.'),
            (5, 'B+', 'Bangalore', 'Karnataka', '560038', '2026-09-15', 'available', 'phone', 'Available for emergency weekend donation camps.')
        `);

        // Seed Hospitals
        console.log('Seeding registered hospitals...');
        await conn.query(`
            INSERT INTO hospitals (id, name, license_number, address, city, state, pincode, contact_phone, contact_email, verification_status)
            VALUES 
            (1, 'CityCare Multispecialty Hospital', 'HOSP-KA-2024-0042', '45 Health Boulevard, Indiranagar', 'Bangalore', 'Karnataka', '560038', '+91-8023456780', 'emergency@citycare.org', 'verified'),
            (2, 'St. Jude Apex Medical Center', 'HOSP-KA-2024-0089', '12 Residency Road, Ashok Nagar', 'Bangalore', 'Karnataka', '560025', '+91-8023456799', 'bloodhelp@stjude.sample', 'verified'),
            (3, 'Greenwood Trauma Clinic', 'HOSP-KA-2025-0105', '88 Outer Ring Road, Marathahalli', 'Bangalore', 'Karnataka', '560037', '+91-8023456810', 'admin@greenwood.sample', 'pending')
        `);

        // Seed Hospital Staff
        await conn.query(`
            INSERT INTO hospital_staff (hospital_id, user_id, designation, is_admin_rep)
            VALUES 
            (1, 3, 'Head of Emergency Services', TRUE),
            (2, 9, 'Senior Critical Care Resident', TRUE)
        `);

        // Seed Blood Banks
        console.log('Seeding blood banks with geolocations...');
        await conn.query(`
            INSERT INTO blood_banks (id, name, license_number, address, city, state, pincode, latitude, longitude, contact_phone, contact_email, operating_hours, verification_status)
            VALUES 
            (1, 'Metro Central Blood Bank & Research Institute', 'BB-KA-2023-011', '101 Victoria Road, Richmond Town', 'Bangalore', 'Karnataka', '560025', 12.9654, 77.6045, '+91-8022114400', 'inventory@metroblood.org', '24/7 Service', 'verified'),
            (2, 'Apollo Red Cross Regional Bank', 'BB-KA-2022-005', '22 Bannermghatta Main Road', 'Bangalore', 'Karnataka', '560076', 12.9135, 77.5968, '+91-8026998800', 'blooddesk@apollobank.org', '24/7 Service', 'verified'),
            (3, 'Lions Civic Community Blood Center', 'BB-KA-2024-019', '5 4th Block, Jayanagar', 'Bangalore', 'Karnataka', '560011', 12.9250, 77.5838, '+91-8026543210', 'lionsblood@sample.org', '8:00 AM - 10:00 PM', 'verified'),
            (4, 'Sunrise Charitable Blood Bank', 'BB-KA-2026-033', '14 Whitefield Main Road', 'Bangalore', 'Karnataka', '560066', 12.9698, 77.7499, '+91-8028451122', 'contact@sunriseblood.sample', '24/7 Service', 'pending')
        `);

        // Seed Blood Bank Staff
        await conn.query(`
            INSERT INTO blood_bank_staff (blood_bank_id, user_id, designation, is_manager)
            VALUES 
            (1, 2, 'Senior Blood Transfusion Officer', TRUE),
            (2, 8, 'Assistant Quality Manager', TRUE)
        `);

        // Seed Inventory Batches
        console.log('Seeding initial inventory batches...');
        await conn.query(`
            INSERT INTO inventory_batches (blood_bank_id, batch_number, blood_group, component, units_available, units_reserved, collection_date, expiry_date, status, storage_location)
            VALUES 
            (1, 'MCBB-2026-A101', 'O+', 'Whole Blood', 14, 0, '2026-11-10', '2026-12-15', 'tested_safe', 'Fridge Unit 1-A'),
            (1, 'MCBB-2026-A102', 'O-', 'Whole Blood', 4, 0, '2026-11-12', '2026-12-17', 'tested_safe', 'Fridge Unit 1-B'),
            (1, 'MCBB-2026-A103', 'A+', 'Packed Red Blood Cells (PRBC)', 18, 0, '2026-11-15', '2026-12-27', 'tested_safe', 'Fridge Unit 2-A'),
            (1, 'MCBB-2026-A104', 'B+', 'Platelets', 8, 0, '2026-11-23', '2026-11-28', 'tested_safe', 'Agitator Chamber 1'),
            (1, 'MCBB-2026-A105', 'AB+', 'Fresh Frozen Plasma (FFP)', 12, 0, '2026-11-01', '2027-11-01', 'tested_safe', 'Deep Freezer -40C'),
            (1, 'MCBB-2026-A106', 'O+', 'Packed Red Blood Cells (PRBC)', 5, 0, '2026-11-24', '2026-12-29', 'quarantined', 'Testing Holding Bay'),
            (2, 'APBB-2026-B201', 'O+', 'Whole Blood', 10, 0, '2026-11-14', '2026-12-19', 'tested_safe', 'Bank Rack 3'),
            (2, 'APBB-2026-B202', 'A+', 'Platelets', 6, 0, '2026-11-22', '2026-11-27', 'tested_safe', 'Agitator Unit 2'),
            (2, 'APBB-2026-B203', 'B-', 'Whole Blood', 3, 0, '2026-11-08', '2026-12-13', 'tested_safe', 'Rare Group Vault'),
            (2, 'APBB-2026-B204', 'AB-', 'Cryoprecipitate', 6, 0, '2026-10-20', '2027-10-20', 'tested_safe', 'Cryo Storage A'),
            (3, 'LION-2026-C301', 'O+', 'Whole Blood', 8, 0, '2026-11-16', '2026-12-21', 'tested_safe', 'Cold Vault 1'),
            (3, 'LION-2026-C302', 'B+', 'Packed Red Blood Cells (PRBC)', 15, 0, '2026-11-18', '2026-12-30', 'tested_safe', 'Cold Vault 2')
        `);

        // Seed Initial Inventory Audit Transactions
        console.log('Seeding initial inventory audit transactions...');
        await conn.query(`
            INSERT INTO inventory_transactions (batch_id, blood_bank_id, change_units, transaction_type, reason, performed_by_user_id)
            VALUES 
            (1, 1, 14, 'addition', 'Initial stock intake from voluntary mobile donation camp', 2),
            (2, 1, 4, 'addition', 'Emergency voluntary donor intake', 2),
            (3, 1, 18, 'addition', 'Component separation PRBC completed and certified', 2),
            (7, 2, 10, 'addition', 'Intake from Rotary donation drive', 8)
        `);

        // Seed Blood Requests (with strict workflow statuses: pending, accepted, processing, completed)
        console.log('Seeding sample blood requests...');
        await conn.query(`
            INSERT INTO blood_requests (id, requester_id, requester_role, patient_name, hospital_id, hospital_name_manual, blood_group, component, units_needed, units_fulfilled, urgency, required_by, contact_phone, delivery_address, city, state, status, assigned_blood_bank_id, processing_stage, notes)
            VALUES 
            (1, 6, 'requester', 'Ramesh Sengupta (Post-Surgery)', 1, 'CityCare Multispecialty Hospital', 'O+', 'Packed Red Blood Cells (PRBC)', 2, 0, 'urgent', DATE_ADD(NOW(), INTERVAL 24 HOUR), '+91-9876543215', 'Ward 4B, CityCare Hospital, Indiranagar', 'Bangalore', 'Karnataka', 'pending', NULL, 'none', 'Patient scheduled for bypass surgery tomorrow morning.'),
            (2, 3, 'hospital', 'Trauma ICU Patient #1042', 1, 'CityCare Multispecialty Hospital', 'O-', 'Whole Blood', 3, 0, 'emergency', DATE_ADD(NOW(), INTERVAL 6 HOUR), '+91-8023456780', 'ICU Resuscitation Bay 2', 'Bangalore', 'Karnataka', 'accepted', 1, 'stock_reserved', 'Critical road traffic accident trauma case. Immediate availability required.'),
            (3, 6, 'requester', 'Sunita M. (Dengue Care)', 2, 'St. Jude Apex Medical Center', 'B+', 'Platelets', 4, 4, 'standard', DATE_SUB(NOW(), INTERVAL 2 DAY), '+91-9876543215', 'Floor 3, St Jude Center', 'Bangalore', 'Karnataka', 'completed', 1, 'completed', 'Platelet count dropped below 20k. Fulfilled by Metro Blood Bank.')
        `);

        // Seed Donor Willingness Expressions
        console.log('Seeding donor willingness responses...');
        await conn.query(`
            INSERT INTO donor_interests (request_id, donor_user_id, availability_note, status)
            VALUES 
            (1, 4, 'Available immediately for O+ whole blood or red cells donation.', 'expressed')
        `);

        // Seed Verified Donations (recorded by authorized staff)
        console.log('Seeding verified donations...');
        await conn.query(`
            INSERT INTO donations (donor_user_id, blood_bank_id, donation_date, blood_group, units_donated, screening_passed, recorded_by_user_id, notes)
            VALUES 
            (4, 1, '2026-08-10', 'O+', 1, TRUE, 2, 'Voluntary walk-in donor at Richmond Town branch.')
        `);

        // Seed In-App Notifications
        console.log('Seeding demo notifications...');
        await conn.query(`
            INSERT INTO notifications (user_id, title, message, type, is_read, link)
            VALUES 
            (6, 'Blood Request Submitted (#1)', 'Your blood request for 2 units of O+ has been submitted with status PENDING.', 'request_update', FALSE, '/requests/1'),
            (4, 'Urgent O+ Need Near You', 'CityCare Hospital requires O+ blood within 24 hours. Check details to express willingness to donate.', 'emergency', FALSE, '/requests/1'),
            (2, '🚨 Emergency Blood Request (#2)', 'Trauma ICU at CityCare Hospital has posted an emergency request for 3 units of O- Whole Blood.', 'emergency', FALSE, '/dashboard/bloodbank'),
            (1, 'System Verification Request', 'Sunrise Charitable Blood Bank submitted license documents for verification.', 'system', FALSE, '/dashboard/admin')
        `);

        // Seed System Audit Logs
        console.log('Seeding audit logs...');
        await conn.query(`
            INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details_json, ip_address)
            VALUES 
            (1, 'SYSTEM_INIT', 'SYSTEM', 1, '{"version": "2.0.0", "description": "Database initialized with strict RBAC rules and operational workflow states"}', '127.0.0.1'),
            (2, 'STOCK_BATCH_ADDED', 'INVENTORY', 1, '{"batch": "MCBB-2026-A101", "units": 14, "group": "O+"}', '127.0.0.1')
        `);

        await conn.commit();
        console.log('✓ CELLS Database seeding completed successfully with strict RBAC rules and demo records.');
    } catch (err) {
        await conn.rollback();
        console.error('✗ Seeding failed:', err);
        process.exitCode = 1;
    } finally {
        conn.release();
    }
}

seed().then(() => process.exit(0));
