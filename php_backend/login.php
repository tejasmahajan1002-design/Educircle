<?php
/**
 * CampusShare - Student & Admin Login API
 * Validates credentials and verifies that the student email has been verified via OTP
 */

require_once __DIR__ . '/db.php';

header('Content-Type: application/json');

$rawInput = file_get_contents('php://input');
$data = json_decode($rawInput, true) ?: $_POST;

$email = strtolower(trim($data['email'] ?? ''));
$password = $data['password'] ?? '';

if (empty($email) || empty($password)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Email and password are required.']);
    exit();
}

$pdo = getDbConnection();

$stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
$stmt->execute([$email]);
$user = $stmt->fetch();

if (!$user) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Invalid email or password.']);
    exit();
}

// 1. Check if Email is Verified
if ((int)$user['email_verified'] === 0) {
    http_response_code(403);
    echo json_encode([
        'success' => false,
        'message' => 'Your email address is not verified yet. Please enter the verification code sent to your email.',
        'requiresVerification' => true,
        'email' => $email
    ]);
    exit();
}

// 2. Check if Account is Blocked
if ($user['status'] === 'blocked') {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Your account has been blocked by administrative moderation.']);
    exit();
}

// 3. Verify Password
if (!password_verify($password, $user['password_hash'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Invalid email or password.']);
    exit();
}

echo json_encode([
    'success' => true,
    'message' => 'Login successful! Welcome back, ' . $user['name'] . '.',
    'user' => [
        'id' => $user['id'],
        'name' => $user['name'],
        'email' => $user['email'],
        'mobileNumber' => $user['mobile_number'],
        'rollNumber' => $user['roll_number'],
        'department' => $user['department'],
        'year' => $user['year'],
        'semester' => $user['semester'],
        'role' => $user['role'],
        'trustScore' => (int)$user['trust_score'],
        'ratingAverage' => (float)$user['rating_average'],
        'status' => $user['status'],
        'emailVerified' => true
    ]
]);
