<?php
/**
 * CampusShare - 1-Click Database Setup & Diagnostic Tool for XAMPP
 * Access in browser: http://localhost/PROJECT 1/php_backend/setup.php
 */

require_once __DIR__ . '/db.php';

header('Content-Type: text/html; charset=utf-8');

try {
    $pdo = getDbConnection();
    
    // Check tables
    $tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
    $userCount = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    $verifiedCount = $pdo->query("SELECT COUNT(*) FROM users WHERE email_verified = 1")->fetchColumn();
    
    echo "<!DOCTYPE html><html><head><title>CampusShare Database Setup</title>";
    echo "<style>body{font-family:'Segoe UI',sans-serif;padding:30px;background:#f8fafc;color:#1e293b;} .card{background:#fff;padding:24px;border-radius:16px;max-width:600px;margin:auto;box-shadow:0 4px 12px rgba(0,0,0,0.05);border:1px solid #e2e8f0;} .badge{background:#10b981;color:#fff;padding:4px 10px;border-radius:9999px;font-size:12px;} pre{background:#f1f5f9;padding:12px;border-radius:8px;font-size:12px;overflow:auto;}</style>";
    echo "</head><body><div class='card'>";
    echo "<h2 style='color:#4349f9;margin-top:0;'>CampusShare MySQL & OTP Setup</h2>";
    echo "<p><span class='badge'>Connected Successfully</span> to database: <strong>" . DB_NAME . "</strong></p>";
    echo "<h4>Installed Tables:</h4><ul>";
    foreach ($tables as $t) {
        echo "<li><code>$t</code></li>";
    }
    echo "</ul>";
    echo "<p>Total Users: <strong>$userCount</strong> (Verified: <strong>$verifiedCount</strong>)</p>";
    echo "<p style='font-size:12px;color:#64748b;'>Default Admin: <code>admin@campushare.edu</code> (Password: <code>admin123</code>)</p>";
    echo "<a href='../index.html' style='display:inline-block;padding:10px 20px;background:#4349f9;color:#fff;text-decoration:none;border-radius:10px;font-weight:bold;font-size:13px;'>Open CampusShare Web App</a>";
    echo "</div></body></html>";
} catch (Exception $e) {
    echo "<h3>Setup Error:</h3><p>" . $e->getMessage() . "</p>";
}
