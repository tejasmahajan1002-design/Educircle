<?php
/**
 * CampusShare - Student Registration API
 * Generates secure 6-digit OTP, stores its bcrypt hash, and dispatches verification email
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/mailer.php';

header('Content-Type: application/json');

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true) ?: $_POST;

$name = trim($data['name'] ?? '');
$email = strtolower(trim($data['email'] ?? ''));
$mobile = trim($data['mobileNumber'] ?? $data['mobile_number'] ?? '');
$roll = trim($data['rollNumber'] ?? $data['roll_number'] ?? '');
$dept = trim($data['department'] ?? '');
$year = trim($data['year'] ?? '1st Year');
$semester = trim($data['semester'] ?? '1st Sem');
$password = $data['password'] ?? '';
$confirmPassword = $data['confirmPassword'] ?? $data['confirm_password'] ?? '';

// 1. Validation Checks
if (empty($name) || empty($email) || empty($mobile) || empty($roll) || empty($dept) || empty($password) || empty($confirmPassword)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'All registration fields are required.']);
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Please provide a valid email address.']);
    exit();
}

if (strlen($mobile) < 10) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Please enter a valid 10-digit mobile number.']);
    exit();
}

if ($password !== $confirmPassword) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Passwords do not match.']);
    exit();
}

if (strlen($password) < 6) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Password must be at least 6 characters long.']);
    exit();
}

$pdo = getDbConnection();

// 2. Check duplicate verified user
$stmt = $pdo->prepare("SELECT id, email_verified, last_otp_request_at FROM users WHERE email = ?");
$stmt->execute([$email]);
$existing = $stmt->fetch();

if ($existing && (int)$existing['email_verified'] === 1) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'An active verified account with this email address already exists.']);
    exit();
}

// 3. Generate Cryptographically Secure 6-Digit OTP
$otp = strval(random_int(100000, 999999));
$otpHash = password_hash($otp, PASSWORD_BCRYPT);
$otpExpiry = date('Y-m-d H:i:s', time() + OTP_EXPIRY_SECONDS);
$passwordHash = password_hash($password, PASSWORD_BCRYPT);
$userId = $existing ? $existing['id'] : ('u_' . bin2hex(random_bytes(8)));

if ($existing) {
    // Update existing unverified registration
    $updateStmt = $pdo->prepare("
        UPDATE users SET 
            name = ?, mobile_number = ?, roll_number = ?, department = ?, year = ?, semester = ?,
            password_hash = ?, otp_hash = ?, otp_expiry = ?, otp_attempts = 0, last_otp_request_at = NOW(),
            email_verified = 0
        WHERE email = ?
    ");
    $updateStmt->execute([$name, $mobile, $roll, $dept, $year, $semester, $passwordHash, $otpHash, $otpExpiry, $email]);
} else {
    // Insert new unverified registration
    $insertStmt = $pdo->prepare("
        INSERT INTO users (
            id, name, email, mobile_number, roll_number, department, year, semester,
            password_hash, role, trust_score, status, email_verified, otp_hash, otp_expiry, otp_attempts, last_otp_request_at
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?,
            ?, 'student', 75, 'active', 0, ?, ?, 0, NOW()
        )
    ");
    $insertStmt->execute([$userId, $name, $email, $mobile, $roll, $dept, $year, $semester, $passwordHash, $otpHash, $otpExpiry]);
}

// 4. Send Verification Email
$mailResult = sendVerificationEmail($email, $name, $otp);

if (!$mailResult['success']) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Registration created but failed to dispatch verification email. Please check your SMTP configuration.'
    ]);
    exit();
}

// Return success WITHOUT exposing OTP
echo json_encode([
    'success' => true,
    'message' => 'Registration initiated! A 6-digit verification code has been sent to ' . $email . '.',
    'email' => $email,
    'resendCooldown' => OTP_RESEND_COOLDOWN,
    'expiresInSeconds' => OTP_EXPIRY_SECONDS
]);
