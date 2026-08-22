<?php
/**
 * CampusShare - OTP Verification API
 * Verifies 6-digit OTP against bcrypt hash, checks 5-minute expiry, and enforces 5-attempt limit
 */

require_once __DIR__ . '/db.php';

header('Content-Type: application/json');

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true) ?: $_POST;

$email = strtolower(trim($data['email'] ?? ''));
$otp = trim($data['otp'] ?? '');

if (empty($email) || empty($otp)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email and 6-digit OTP code are required.']);
    exit();
}

if (!preg_match('/^[0-9]{6}$/', $otp)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Verification code must be exactly 6 numeric digits.']);
    exit();
}

$pdo = getDbConnection();

$stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'No registration record found for this email.']);
    exit();
}

if ((int)$user['email_verified'] === 1) {
    echo json_encode([
        'success' => true,
        'message' => 'Your email is already verified. You can proceed to log in.',
        'user' => [
            'id' => $user['id'],
            'name' => $user['name'],
            'email' => $user['email'],
            'department' => $user['department'],
            'role' => $user['role'],
            'trustScore' => $user['trust_score']
        ]
    ]);
    exit();
}

// 1. Check Maximum Attempts (5 Attempts)
$currentAttempts = (int)($user['otp_attempts'] ?? 0);
if ($currentAttempts >= OTP_MAX_ATTEMPTS) {
    http_response_code(429);
    echo json_encode([
        'success' => false,
        'message' => 'Maximum verification attempts exceeded (5). For your security, this OTP is locked. Please click Resend OTP to receive a new code.',
        'locked' => true
    ]);
    exit();
}

// 2. Check Expiry (5 Minutes)
$expiryTimestamp = strtotime($user['otp_expiry']);
if (time() > $expiryTimestamp) {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Verification code has expired (valid for 5 minutes only). Please click Resend OTP to get a new code.',
        'expired' => true
    ]);
    exit();
}

// 3. Verify OTP against stored hash
if (!password_verify($otp, $user['otp_hash'])) {
    $newAttempts = $currentAttempts + 1;
    $updateStmt = $pdo->prepare("UPDATE users SET otp_attempts = ? WHERE email = ?");
    $updateStmt->execute([$newAttempts, $email]);

    $remaining = OTP_MAX_ATTEMPTS - $newAttempts;
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Invalid verification code. ' . ($remaining > 0 ? "You have $remaining attempt(s) remaining." : 'Maximum attempts reached. Please request a new OTP.'),
        'attemptsRemaining' => max(0, $remaining),
        'locked' => $remaining <= 0
    ]);
    exit();
}

// 4. Activate User Account
$activateStmt = $pdo->prepare("
    UPDATE users SET 
        email_verified = 1,
        otp_hash = NULL,
        otp_expiry = NULL,
        otp_attempts = 0,
        status = 'active'
    WHERE email = ?
");
$activateStmt->execute([$email]);

// Fetch updated user
$stmt->execute([$email]);
$activatedUser = $stmt->fetch();

echo json_encode([
    'success' => true,
    'message' => 'Email verified successfully! Welcome to CampusShare.',
    'user' => [
        'id' => $activatedUser['id'],
        'name' => $activatedUser['name'],
        'email' => $activatedUser['email'],
        'mobileNumber' => $activatedUser['mobile_number'],
        'rollNumber' => $activatedUser['roll_number'],
        'department' => $activatedUser['department'],
        'year' => $activatedUser['year'],
        'semester' => $activatedUser['semester'],
        'role' => $activatedUser['role'],
        'trustScore' => (int)$activatedUser['trust_score'],
        'ratingAverage' => (float)$activatedUser['rating_average'],
        'status' => $activatedUser['status'],
        'emailVerified' => true
    ]
]);
