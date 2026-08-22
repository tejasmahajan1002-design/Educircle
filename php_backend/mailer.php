<?php
/**
 * CampusShare - Email Delivery Module
 * Sends professional HTML verification emails via SMTP or PHP mail()
 */

require_once __DIR__ . '/config.php';

function sendVerificationEmail($toEmail, $recipientName, $otpCode) {
    $subject = "Verify Your Email - Student Resource Sharing Platform";

    $htmlContent = "
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset='utf-8'>
      <style>
        body { font-family: 'Segoe UI', Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
        .container { max-width: 540px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
        .header { background: linear-gradient(135deg, #4349f9, #5c6cff); padding: 32px 24px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px; }
        .content { padding: 32px 24px; }
        .otp-box { background: #f0f3ff; border: 2px dashed #abbdff; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
        .otp-code { font-size: 34px; font-weight: 800; letter-spacing: 8px; color: #282991; font-family: monospace; }
        .badge { display: inline-block; background: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600; margin-top: 8px; }
        .footer { background: #f1f5f9; padding: 20px 24px; text-align: center; font-size: 12px; color: #64748b; }
      </style>
    </head>
    <body>
      <div class='container'>
        <div class='header'>
          <h1>CampusShare</h1>
          <p style='margin: 6px 0 0 0; opacity: 0.9; font-size: 13px;'>Community & Resource Sharing Hub</p>
        </div>
        <div class='content'>
          <p style='font-size: 15px; margin-top: 0;'>Hello <strong>" . htmlspecialchars($recipientName) . "</strong>,</p>
          <p style='font-size: 13px; color: #475569; line-height: 1.6;'>
            Thank you for registering on <strong>CampusShare</strong>. Please use the following 6-digit verification code to activate your student account:
          </p>
          
          <div class='otp-box'>
            <div class='otp-code'>" . htmlspecialchars($otpCode) . "</div>
            <div class='badge'>⏱ Valid for 5 minutes only</div>
          </div>

          <p style='font-size: 12px; color: #64748b; line-height: 1.5;'>
            ⚠️ <strong>Security Notice:</strong> Do not share this code with anyone. Campus administrators and students will never ask for your verification code.
          </p>
          <p style='font-size: 12px; color: #64748b; margin-bottom: 0;'>
            If you did not initiate this registration, you can safely disregard this email.
          </p>
        </div>
        <div class='footer'>
          &copy; " . date('Y') . " CampusShare - Student Resource & Trust System. All rights reserved.
        </div>
      </div>
    </body>
    </html>
    ";

    // 1. Try sending via SMTP socket if enabled and credentials provided
    if (SMTP_ENABLED && SMTP_USER !== 'your-app-password-here' && SMTP_PASS !== 'your-app-password-here') {
        $smtpResult = sendViaSmtpSocket($toEmail, $recipientName, $subject, $htmlContent);
        if ($smtpResult['success']) {
            return ['success' => true, 'mode' => 'smtp'];
        }
    }

    // 2. Fallback to native PHP mail() function
    $headers = [
        'MIME-Version: 1.0',
        'Content-type: text/html; charset=utf-8',
        'From: ' . SMTP_FROM_NAME . ' <' . SMTP_FROM_EMAIL . '>',
        'Reply-To: ' . SMTP_FROM_EMAIL,
        'X-Mailer: PHP/' . phpversion()
    ];

    $mailSent = @mail($toEmail, $subject, $htmlContent, implode("\r\n", $headers));
    if ($mailSent) {
        return ['success' => true, 'mode' => 'php_mail'];
    }

    // 3. For local offline development (XAMPP without live internet/SMTP setup), log the email to file for inspection
    $logDir = __DIR__ . '/email_logs';
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0777, true);
    }
    $logFile = $logDir . '/otp_' . date('Ymd_His') . '_' . preg_replace('/[^a-zA-Z0-9]/', '', $toEmail) . '.html';
    @file_put_contents($logFile, "<!-- To: $toEmail | Code: $otpCode -->\n" . $htmlContent);

    return [
        'success' => true,
        'mode' => 'local_logged',
        'log_file' => $logFile
    ];
}

/**
 * Lightweight SMTP socket client for TLS/SSL
 */
function sendViaSmtpSocket($toEmail, $recipientName, $subject, $htmlBody) {
    $timeout = 10;
    $host = SMTP_HOST;
    $port = SMTP_PORT;

    $socketPrefix = (SMTP_SECURE === 'ssl' || $port == 465) ? 'ssl://' : '';
    $socket = @fsockopen($socketPrefix . $host, $port, $errno, $errstr, $timeout);

    if (!$socket) {
        return ['success' => false, 'error' => "Could not connect to SMTP server: $errstr ($errno)"];
    }

    $read = function() use ($socket) {
        $response = "";
        while ($str = fgets($socket, 515)) {
            $response .= $str;
            if (substr($str, 3, 1) == " ") break;
        }
        return $response;
    };

    $send = function($cmd) use ($socket) {
        fputs($socket, $cmd . "\r\n");
    };

    $read();
    $send("EHLO " . gethostname());
    $read();

    if (SMTP_SECURE === 'tls' || $port == 587) {
        $send("STARTTLS");
        $tlsResponse = $read();
        if (substr($tlsResponse, 0, 3) != '220') {
            fclose($socket);
            return ['success' => false, 'error' => 'STARTTLS failed'];
        }
        stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
        $send("EHLO " . gethostname());
        $read();
    }

    $send("AUTH LOGIN");
    $read();
    $send(base64_encode(SMTP_USER));
    $read();
    $send(base64_encode(SMTP_PASS));
    $authResp = $read();

    if (substr($authResp, 0, 3) != '235') {
        fclose($socket);
        return ['success' => false, 'error' => 'SMTP Authentication failed'];
    }

    $send("MAIL FROM: <" . SMTP_FROM_EMAIL . ">");
    $read();
    $send("RCPT TO: <" . $toEmail . ">");
    $read();
    $send("DATA");
    $read();

    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: " . SMTP_FROM_NAME . " <" . SMTP_FROM_EMAIL . ">\r\n";
    $headers .= "To: " . $recipientName . " <" . $toEmail . ">\r\n";
    $headers .= "Subject: " . $subject . "\r\n";
    $headers .= "Date: " . date('r') . "\r\n";

    $send($headers . "\r\n" . $htmlBody . "\r\n.");
    $read();

    $send("QUIT");
    fclose($socket);

    return ['success' => true];
}
