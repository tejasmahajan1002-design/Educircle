<?php
/**
 * CampusShare - Resend OTP API
 * Enforces 60-second cooldown rate limiting and issues a new 6-digit verification code
 */

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/mailer.php';

header('Content-Type: application/json');

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true) ?: $_POST;

$email = strtolower(trim($data['email'] ?? ''));

if (empty($email)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email is required to resend verification code.']);
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
    echo json_encode(['success' => true, 'message' => 'Your email is already verified. You can log in directly.']);
    exit();
}

// 1. Rate Limiting Check (60 Seconds Cooldown)
if (!empty($user['last_otp_request_at'])) {
    $lastRequestTime = strtotime($user['last_otp_request_at']);
    $elapsed = time() - $lastRequestTime;
    if ($elapsed < OTP_RESEND_COOLDOWN) {
        $waitSecs = OTP_RESEND_COOLDOWN - $elapsed;
        http_response_code(429);
        echo json_encode([
            'success' => false,
            'message' => "Please wait $waitSecs second(s) before requesting another OTP.",
            'cooldownSeconds' => $waitSecs
        ]);
        exit();
    }
}

// 2. Generate Fresh 6-Digit OTP & Update Database
$newOtp = strval(random_int(100000, 999999));
$newOtpHash = password_hash($newOtp, PASSWORD_BCRYPT);
$newExpiry = date('Y-m-d H:i:s', time() + OTP_EXPIRY_SECONDS);

$updateStmt = $pdo->prepare("
    UPDATE users SET 
        otp_hash = ?, 
        otp_expiry = ?, 
        otp_attempts = 0, 
        last_otp_request_at = NOW() 
    WHERE email = ?
");
$updateStmt->execute([$newOtpHash, $newExpiry, $email]);

// 3. Send Verification Email
$mailResult = sendVerificationEmail($email, $user['name'], $newOtp);

if (!$mailResult['success']) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to dispatch email. Please check SMTP settings.'
    ]);
    exit();
}

echo json_encode([
    'success' => true,
    'message' => 'A new 6-digit verification code has been sent to ' . $email . '.',
    'cooldownSeconds' => OTP_RESEND_COOLDOWN,
    'expiresInSeconds' => OTP_EXPIRY_SECONDS
]);
