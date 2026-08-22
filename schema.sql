-- ====================================================================
-- CampusShare Database Schema & Migration Script
-- Borrowing, Return, Security Deposit, Trust & Email OTP Verification System
-- Compatible with MySQL (XAMPP) / MariaDB / PostgreSQL / SQLite
-- ====================================================================

-- 1. USERS & STUDENTS TABLE
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    mobile_number VARCHAR(20) NOT NULL,
    roll_number VARCHAR(50) NOT NULL,
    department VARCHAR(150) NOT NULL,
    year VARCHAR(50) DEFAULT '1st Year',
    semester VARCHAR(50) DEFAULT '1st Sem',
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    trust_score INT DEFAULT 75 CHECK (trust_score BETWEEN 0 AND 100),
    rating_average DECIMAL(3, 2) DEFAULT 0.00,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'blocked')),
    
    -- Email OTP Verification Fields
    email_verified TINYINT(1) DEFAULT 0,
    otp_hash VARCHAR(255) NULL,
    otp_expiry DATETIME NULL,
    otp_attempts INT DEFAULT 0,
    last_otp_request_at DATETIME NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. RESOURCES & PHYSICAL / DIGITAL ITEMS TABLE
CREATE TABLE IF NOT EXISTS resources (
    id VARCHAR(64) PRIMARY KEY,
    owner_id VARCHAR(64) NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('Physical Item', 'Digital Resource')),
    item_value DECIMAL(10, 2) DEFAULT 1000.00,
    quantity INT DEFAULT 1,
    available_quantity INT DEFAULT 1,
    listing_method VARCHAR(50) DEFAULT 'rent', -- 'rent', 'sell', 'exchange'
    price DECIMAL(10, 2) DEFAULT 0.00,
    swap_preferences TEXT NULL,
    item_condition VARCHAR(50) DEFAULT 'Good Condition' CHECK (item_condition IN ('New / Like New', 'Good Condition', 'Used / Working', 'Fair Condition')),
    availability VARCHAR(30) DEFAULT 'available' CHECK (availability IN ('available', 'requested', 'borrowed', 'maintenance')),
    lending_duration INT DEFAULT 7,
    location VARCHAR(150) DEFAULT 'Campus',
    image_url LONGTEXT NULL,
    file_url TEXT NULL,
    rating_average DECIMAL(3, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 3. BORROW REQUESTS TABLE
CREATE TABLE IF NOT EXISTS borrow_requests (
    id VARCHAR(64) PRIMARY KEY,
    resource_id VARCHAR(64) NOT NULL,
    requester_id VARCHAR(64) NOT NULL,
    quantity INT DEFAULT 1,
    borrow_date DATE NOT NULL,
    return_date DATE NOT NULL,
    purpose TEXT NOT NULL,
    suggested_deposit_min DECIMAL(10, 2),
    suggested_deposit_max DECIMAL(10, 2),
    status VARCHAR(30) DEFAULT 'Pending Request' CHECK (status IN ('Pending Request', 'Accepted', 'Rejected', 'Cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. BORROWING TRANSACTIONS TABLE (CORE TRANSACTION & DEPOSIT SYSTEM)
CREATE TABLE IF NOT EXISTS borrowing_transactions (
    id VARCHAR(64) PRIMARY KEY,
    request_id VARCHAR(64),
    resource_id VARCHAR(64) NOT NULL,
    borrower_id VARCHAR(64) NOT NULL,
    owner_id VARCHAR(64) NOT NULL,
    quantity INT DEFAULT 1,
    tx_type VARCHAR(50) DEFAULT 'rent', -- 'rent', 'sell', 'exchange'
    price DECIMAL(10, 2) DEFAULT 0.00,
    swap_resource_id VARCHAR(64) NULL,
    rental_days INT DEFAULT 1,
    payment_status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Paid', 'Refunded'
    item_value DECIMAL(10, 2) NOT NULL DEFAULT 1000.00,
    security_deposit_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    deposit_required TINYINT(1) DEFAULT 1,
    
    -- Transaction Status:
    -- 'Pending Request', 'Accepted', 'Active Borrow', 'Return Requested', 'Returned', 'Overdue', 'Disputed', 'Cancelled'
    transaction_status VARCHAR(30) NOT NULL DEFAULT 'Pending Request',
    
    -- Security Deposit Status:
    -- 'Pending', 'Paid/Held', 'Released', 'Partially Deducted', 'Fully Deducted', 'Disputed'
    deposit_status VARCHAR(30) NOT NULL DEFAULT 'Pending',
    
    borrow_date DATE NOT NULL,
    expected_return_date DATE NOT NULL,
    actual_return_date DATE NULL,
    
    -- Pre-handover Inspection
    initial_condition TEXT NULL,
    initial_photos JSON NULL,
    
    -- Return Inspection
    return_condition TEXT NULL,
    return_photos JSON NULL,
    
    -- Deposit Deductions & Disputes
    deduction_reason TEXT NULL,
    deduction_amount DECIMAL(10, 2) DEFAULT 0.00,
    remaining_deposit DECIMAL(10, 2) DEFAULT 0.00,
    borrower_dispute_note TEXT NULL,
    admin_resolution_note TEXT NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
    FOREIGN KEY (borrower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. MESSAGES & CHAT THREADS
CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(64) PRIMARY KEY,
    sender_id VARCHAR(64) NOT NULL,
    receiver_id VARCHAR(64) NOT NULL,
    content TEXT NOT NULL,
    resource_id VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    related_id VARCHAR(64),
    is_read TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. RATINGS & TRUST REVIEWS
CREATE TABLE IF NOT EXISTS ratings (
    id VARCHAR(64) PRIMARY KEY,
    transaction_id VARCHAR(64) NOT NULL,
    rater_id VARCHAR(64) NOT NULL,
    ratee_id VARCHAR(64) NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    review TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (transaction_id) REFERENCES borrowing_transactions(id) ON DELETE CASCADE,
    FOREIGN KEY (rater_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (ratee_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 8. INDEXES FOR HIGH PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email, email_verified);
CREATE INDEX IF NOT EXISTS idx_transactions_borrower ON borrowing_transactions(borrower_id);
CREATE INDEX IF NOT EXISTS idx_transactions_owner ON borrowing_transactions(owner_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON borrowing_transactions(transaction_status);
CREATE INDEX IF NOT EXISTS idx_transactions_deposit_status ON borrowing_transactions(deposit_status);
CREATE INDEX IF NOT EXISTS idx_resources_availability ON resources(availability);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
