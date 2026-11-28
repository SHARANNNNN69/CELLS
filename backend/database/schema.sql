-- CELLS Database Schema
-- Blood Donation & Emergency Management Network (Strict RBAC & Operational Workflows)

DROP DATABASE IF EXISTS cells_db;
CREATE DATABASE cells_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cells_db;

-- 1. Users table (Central authentication & core role)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(160) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    role ENUM('public_visitor', 'donor', 'requester', 'hospital', 'blood_bank', 'admin') NOT NULL DEFAULT 'public_visitor',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_role (role),
    INDEX idx_user_email (email)
) ENGINE=InnoDB;

-- 2. Donor Profiles
CREATE TABLE IF NOT EXISTS donor_profiles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
    city VARCHAR(80) NOT NULL,
    state VARCHAR(80) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    last_donation_date DATE NULL,
    availability_status ENUM('available', 'unavailable', 'recently_donated') NOT NULL DEFAULT 'available',
    contact_preference ENUM('phone', 'email', 'in_app') NOT NULL DEFAULT 'in_app',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_donor_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_donor_blood_group (blood_group),
    INDEX idx_donor_city (city),
    INDEX idx_donor_status (availability_status)
) ENGINE=InnoDB;

-- 3. Hospitals
CREATE TABLE IF NOT EXISTS hospitals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(180) NOT NULL,
    license_number VARCHAR(100) NOT NULL UNIQUE,
    address TEXT NOT NULL,
    city VARCHAR(80) NOT NULL,
    state VARCHAR(80) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    contact_email VARCHAR(160) NOT NULL,
    verification_status ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_hospital_city (city),
    INDEX idx_hospital_status (verification_status)
) ENGINE=InnoDB;

-- 4. Hospital Staff / Representatives
CREATE TABLE IF NOT EXISTS hospital_staff (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hospital_id INT NOT NULL,
    user_id INT NOT NULL UNIQUE,
    designation VARCHAR(100) NOT NULL DEFAULT 'Medical Officer',
    is_admin_rep BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_staff_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
    CONSTRAINT fk_staff_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 5. Blood Banks
CREATE TABLE IF NOT EXISTS blood_banks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(180) NOT NULL,
    license_number VARCHAR(100) NOT NULL UNIQUE,
    address TEXT NOT NULL,
    city VARCHAR(80) NOT NULL,
    state VARCHAR(80) NOT NULL,
    pincode VARCHAR(10) NOT NULL,
    latitude DECIMAL(10, 6) NOT NULL DEFAULT 12.9716,
    longitude DECIMAL(10, 6) NOT NULL DEFAULT 77.5946,
    contact_phone VARCHAR(20) NOT NULL,
    contact_email VARCHAR(160) NOT NULL,
    operating_hours VARCHAR(100) DEFAULT '24/7 Service',
    verification_status ENUM('pending', 'verified', 'rejected') NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_bank_city (city),
    INDEX idx_bank_status (verification_status)
) ENGINE=InnoDB;

-- 6. Blood Bank Staff / Managers
CREATE TABLE IF NOT EXISTS blood_bank_staff (
    id INT AUTO_INCREMENT PRIMARY KEY,
    blood_bank_id INT NOT NULL,
    user_id INT NOT NULL UNIQUE,
    designation VARCHAR(100) NOT NULL DEFAULT 'Inventory Officer',
    is_manager BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bbstaff_bank FOREIGN KEY (blood_bank_id) REFERENCES blood_banks(id) ON DELETE CASCADE,
    CONSTRAINT fk_bbstaff_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Blood Requests (Created strictly by Hospitals/Doctors or Requesters)
CREATE TABLE IF NOT EXISTS blood_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    requester_id INT NOT NULL,
    requester_role ENUM('hospital', 'requester') NOT NULL,
    patient_name VARCHAR(120) NOT NULL,
    hospital_id INT NULL,
    hospital_name_manual VARCHAR(180) NULL,
    blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
    component ENUM('Whole Blood', 'Packed Red Blood Cells (PRBC)', 'Platelets', 'Fresh Frozen Plasma (FFP)', 'Cryoprecipitate') NOT NULL DEFAULT 'Whole Blood',
    units_needed INT NOT NULL CHECK (units_needed > 0),
    units_fulfilled INT NOT NULL DEFAULT 0,
    urgency ENUM('standard', 'urgent', 'emergency') NOT NULL DEFAULT 'standard',
    required_by DATETIME NOT NULL,
    contact_phone VARCHAR(20) NOT NULL,
    delivery_address TEXT NOT NULL,
    city VARCHAR(80) NOT NULL,
    state VARCHAR(80) NOT NULL,
    status ENUM('pending', 'accepted', 'rejected', 'processing', 'dispatched', 'completed', 'cancelled') NOT NULL DEFAULT 'pending',
    assigned_blood_bank_id INT NULL,
    rejection_reason TEXT NULL,
    processing_stage ENUM('none', 'stock_reserved', 'crossmatch_verified', 'dispatched', 'completed') NOT NULL DEFAULT 'none',
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_request_user FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_request_hospital FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL,
    CONSTRAINT fk_request_assigned_bank FOREIGN KEY (assigned_blood_bank_id) REFERENCES blood_banks(id) ON DELETE SET NULL,
    INDEX idx_req_blood_group (blood_group),
    INDEX idx_req_city (city),
    INDEX idx_req_status (status),
    INDEX idx_req_urgency (urgency)
) ENGINE=InnoDB;

-- 8. Donor Willingness Expressions (Separate Donor Workflow)
CREATE TABLE IF NOT EXISTS donor_interests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id INT NOT NULL,
    donor_user_id INT NOT NULL,
    availability_note VARCHAR(255) NULL,
    status ENUM('expressed', 'contacted', 'screened', 'donated', 'declined') NOT NULL DEFAULT 'expressed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_interest_request FOREIGN KEY (request_id) REFERENCES blood_requests(id) ON DELETE CASCADE,
    CONSTRAINT fk_interest_donor FOREIGN KEY (donor_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_interest_req (request_id),
    INDEX idx_interest_donor (donor_user_id)
) ENGINE=InnoDB;

-- 9. Inventory Batches (Blood Bank Stocks)
CREATE TABLE IF NOT EXISTS inventory_batches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    blood_bank_id INT NOT NULL,
    batch_number VARCHAR(60) NOT NULL,
    blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
    component ENUM('Whole Blood', 'Packed Red Blood Cells (PRBC)', 'Platelets', 'Fresh Frozen Plasma (FFP)', 'Cryoprecipitate') NOT NULL DEFAULT 'Whole Blood',
    units_available INT NOT NULL DEFAULT 0 CHECK (units_available >= 0),
    units_reserved INT NOT NULL DEFAULT 0 CHECK (units_reserved >= 0),
    collection_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status ENUM('quarantined', 'tested_safe', 'rejected', 'expired', 'depleted') NOT NULL DEFAULT 'quarantined',
    storage_location VARCHAR(80) DEFAULT 'Main Refrigerator A',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_batch_bank (blood_bank_id, batch_number),
    CONSTRAINT fk_inv_bank FOREIGN KEY (blood_bank_id) REFERENCES blood_banks(id) ON DELETE CASCADE,
    INDEX idx_inv_group_comp (blood_group, component),
    INDEX idx_inv_expiry (expiry_date),
    INDEX idx_inv_status (status)
) ENGINE=InnoDB;

-- 10. Inventory Audit / Transactions (Safety & traceability)
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    batch_id INT NOT NULL,
    blood_bank_id INT NOT NULL,
    change_units INT NOT NULL, -- positive for addition/return, negative for deduction
    transaction_type ENUM('addition', 'reservation', 'fulfillment', 'disposal', 'adjustment') NOT NULL,
    reference_request_id INT NULL,
    reason VARCHAR(255) NOT NULL,
    performed_by_user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_trans_batch FOREIGN KEY (batch_id) REFERENCES inventory_batches(id) ON DELETE CASCADE,
    CONSTRAINT fk_trans_bank FOREIGN KEY (blood_bank_id) REFERENCES blood_banks(id) ON DELETE CASCADE,
    CONSTRAINT fk_trans_user FOREIGN KEY (performed_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_trans_batch (batch_id)
) ENGINE=InnoDB;

-- 11. Verified Voluntary Donations (Recorded strictly by authorized Blood Bank personnel)
CREATE TABLE IF NOT EXISTS donations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    donor_user_id INT NOT NULL,
    blood_bank_id INT NOT NULL,
    donation_date DATE NOT NULL,
    blood_group ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NOT NULL,
    units_donated INT NOT NULL DEFAULT 1,
    screening_passed BOOLEAN NOT NULL DEFAULT TRUE,
    recorded_by_user_id INT NOT NULL,
    notes VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_don_user FOREIGN KEY (donor_user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_don_bank FOREIGN KEY (blood_bank_id) REFERENCES blood_banks(id) ON DELETE CASCADE,
    CONSTRAINT fk_don_staff FOREIGN KEY (recorded_by_user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_don_donor (donor_user_id)
) ENGINE=InnoDB;

-- 12. In-App Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title VARCHAR(160) NOT NULL,
    message TEXT NOT NULL,
    type ENUM('emergency', 'request_update', 'inventory_alert', 'system') NOT NULL DEFAULT 'system',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    link VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_notif_user_read (user_id, is_read)
) ENGINE=InnoDB;

-- 13. System Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(60) NOT NULL,
    entity_id INT NULL,
    details_json JSON NULL,
    ip_address VARCHAR(45) DEFAULT '127.0.0.1',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_audit_action (action),
    INDEX idx_audit_entity (entity_type, entity_id)
) ENGINE=InnoDB;
