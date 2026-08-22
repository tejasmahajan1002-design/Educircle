<?php
/**
 * CampusShare - Configuration File
 * Centralized Settings for MySQL Database & Email SMTP
 */

// Database Credentials for XAMPP MySQL
define('DB_HOST', getenv('DB_HOST') ?: 'localhost');
define('DB_NAME', getenv('DB_NAME') ?: 'campushare_db');
define('DB_USER', getenv('DB_USER') ?: 'root');
define('DB_PASS', getenv('DB_PASS') ?: '');
define('DB_PORT', getenv('DB_PORT') ?: '3306');

// OTP Security Settings
define('OTP_EXPIRY_SECONDS', 300); // 5 Minutes
define('OTP_MAX_ATTEMPTS', 5);      // Max 5 failed attempts
define('OTP_RESEND_COOLDOWN', 60);  // 60 Seconds cooldown between requests

// Application Settings
define('APP_NAME', 'CampusShare - Student Resource Sharing Platform');
define('APP_URL', getenv('APP_URL') ?: 'http://localhost/PROJECT 1');

// Email SMTP Settings (Supports Gmail, Brevo, SendGrid, Mailtrap, or Local XAMPP sendmail)
// Instructions: Set your college/project SMTP details below or via Environment variables
define('SMTP_ENABLED', true);
define('SMTP_HOST', getenv('SMTP_HOST') ?: 'smtp.gmail.com');
define('SMTP_PORT', getenv('SMTP_PORT') ?: 587); // 587 for TLS, 465 for SSL
define('SMTP_SECURE', getenv('SMTP_SECURE') ?: 'tls'); // 'tls' or 'ssl'
define('SMTP_USER', getenv('SMTP_USER') ?: 'mahajantejas010@gmail.com');
define('SMTP_PASS', getenv('SMTP_PASS') ?: 'logqrretidlfcigk'); // App Password
define('SMTP_FROM_EMAIL', getenv('SMTP_FROM_EMAIL') ?: 'mahajantejas010@gmail.com');
define('SMTP_FROM_NAME', getenv('SMTP_FROM_NAME') ?: 'CampusShare Verification');

// CORS Headers for API calls
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}
