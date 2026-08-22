<?php
/**
 * CampusShare - Database Connection & Initialization
 * Uses PDO with Prepared Statements for maximum security against SQL Injection
 */

require_once __DIR__ . '/config.php';

function getDbConnection() {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    try {
        // First connect to MySQL server without database to check/create database
        $dsnInitial = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";charset=utf8mb4";
        $pdoInit = new PDO($dsnInitial, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);

        $pdoInit->exec("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

        // Now connect to the specific database
        $dsn = "mysql:host=" . DB_HOST . ";port=" . DB_PORT . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false
        ]);

        // Auto initialize tables if not exist
        initDatabaseTables($pdo);

        return $pdo;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'message' => 'Database connection error: ' . $e->getMessage()
        ]);
        exit();
    }
}

function initDatabaseTables($pdo) {
    // 1. Users Table with OTP Verification Fields
    $pdo->exec("
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
            role VARCHAR(20) DEFAULT 'student',
            trust_score INT DEFAULT 75,
            rating_average DECIMAL(3, 2) DEFAULT 0.00,
            status VARCHAR(20) DEFAULT 'active',
            
            -- OTP & Email Verification Columns
            email_verified TINYINT(1) DEFAULT 0,
            otp_hash VARCHAR(255) NULL,
            otp_expiry DATETIME NULL,
            otp_attempts INT DEFAULT 0,
            last_otp_request_at DATETIME NULL,
            
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    // Insert Default Admin if not exists
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute(['admin@campushare.edu']);
    if (!$stmt->fetch()) {
        $adminPass = password_hash('admin123', PASSWORD_BCRYPT);
        $insertAdmin = $pdo->prepare("
            INSERT INTO users (id, name, email, mobile_number, roll_number, department, year, semester, password_hash, role, trust_score, status, email_verified)
            VALUES ('u_admin', 'Campus Administrator', 'admin@campushare.edu', '9999999999', 'ADMIN01', 'Administration', 'N/A', 'N/A', ?, 'admin', 100, 'active', 1)
        ");
        $insertAdmin->execute([$adminPass]);
    }

    // 2. Resources Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS resources (
            id VARCHAR(64) PRIMARY KEY,
            owner_id VARCHAR(64) NOT NULL,
            name VARCHAR(255) NOT NULL,
            category VARCHAR(100) NOT NULL,
            description TEXT NOT NULL,
            type VARCHAR(50) NOT NULL,
            item_value DECIMAL(10, 2) DEFAULT 1000.00,
            quantity INT DEFAULT 1,
            available_quantity INT DEFAULT 1,
            listing_method VARCHAR(50) DEFAULT 'rent',
            price DECIMAL(10, 2) DEFAULT 0.00,
            swap_preferences TEXT NULL,
            item_condition VARCHAR(50) DEFAULT 'Good Condition',
            availability VARCHAR(30) DEFAULT 'available',
            lending_duration INT DEFAULT 7,
            location VARCHAR(150) DEFAULT 'Campus',
            image_url LONGTEXT NULL,
            file_url TEXT NULL,
            rating_average DECIMAL(3, 2) DEFAULT 0.00,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");

    // 3. Transactions Table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS borrowing_transactions (
            id VARCHAR(64) PRIMARY KEY,
            resource_id VARCHAR(64) NOT NULL,
            borrower_id VARCHAR(64) NOT NULL,
            owner_id VARCHAR(64) NOT NULL,
            quantity INT DEFAULT 1,
            tx_type VARCHAR(50) DEFAULT 'rent',
            price DECIMAL(10, 2) DEFAULT 0.00,
            swap_resource_id VARCHAR(64) NULL,
            rental_days INT DEFAULT 1,
            payment_status VARCHAR(50) DEFAULT 'Pending',
            item_value DECIMAL(10, 2) NOT NULL,
            security_deposit_amount DECIMAL(10, 2) NOT NULL,
            deposit_required TINYINT(1) DEFAULT 1,
            transaction_status VARCHAR(30) NOT NULL DEFAULT 'Pending Request',
            deposit_status VARCHAR(30) NOT NULL DEFAULT 'Pending',
            borrow_date DATE NOT NULL,
            expected_return_date DATE NOT NULL,
            actual_return_date DATE NULL,
            initial_condition TEXT NULL,
            initial_photos JSON NULL,
            return_condition TEXT NULL,
            return_photos JSON NULL,
            deduction_reason TEXT NULL,
            deduction_amount DECIMAL(10, 2) DEFAULT 0.00,
            remaining_deposit DECIMAL(10, 2) DEFAULT 0.00,
            borrower_dispute_note TEXT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE,
            FOREIGN KEY (borrower_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    ");
}
