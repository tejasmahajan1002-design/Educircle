const nodemailer = require('nodemailer');
require('dotenv').config();

// Create Reusable Transporter
function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT) || 587;
  const user = process.env.EMAIL_USER || process.env.SMTP_USER || '';
  const pass = process.env.EMAIL_PASS || process.env.SMTP_PASS || '';

  if (user && pass && pass !== 'your-app-password-here') {
    if (host.includes('gmail')) {
      return nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass }
      });
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  return null;
}

/**
 * Send 6-Digit Email Verification Code
 * @param {string} toEmail - Student recipient email
 * @param {string} studentName - Student's full name
 * @param {string} otpCode - 6-digit verification code
 */
async function sendVerificationEmail(toEmail, studentName, otpCode) {
  const transporter = createTransporter();

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
      <div style="background: linear-gradient(135deg, #4349f9, #3535e2); padding: 32px 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">CampusShare Hub</h1>
        <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Student Resource Sharing & Trust Platform</p>
      </div>

      <div style="padding: 32px 28px; color: #1e293b;">
        <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #0f172a;">Verify Your Email Address</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">
          Hello <strong>${studentName}</strong>,<br>
          Thank you for registering on CampusShare. Please use the 6-digit verification code below to activate your student profile.
        </p>

        <div style="background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
          <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b; display: block; margin-bottom: 8px;">Your 6-Digit Verification Code</span>
          <div style="font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #4349f9; font-family: monospace;">${otpCode}</div>
          <span style="display: inline-block; margin-top: 10px; padding: 4px 12px; background: #fef3c7; color: #92400e; border-radius: 9999px; font-size: 11px; font-weight: 700;">⏱ Valid for 5 minutes</span>
        </div>

        <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; font-size: 12px; color: #78350f; margin-bottom: 24px;">
          <strong>Security Notice:</strong> Do not share this code with anyone. Campus administrators and students will never ask for your verification code.
        </div>

        <p style="font-size: 12px; color: #94a3b8; line-height: 1.5; margin: 0;">
          If you did not attempt to register on CampusShare, you can safely ignore this email.
        </p>
      </div>

      <div style="background: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
        © 2026 CampusShare Platform • Safe & Verified College Lending Hub
      </div>
    </div>
  `;

  if (transporter) {
    try {
      const fromAddr = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply.campushare@gmail.com';
      const info = await transporter.sendMail({
        from: `"CampusShare Verification" <${fromAddr}>`,
        to: toEmail,
        subject: 'Verify Your Email - Student Resource Sharing Platform',
        html: htmlContent
      });
      console.log(`[EMAIL DISPATCH] Real-time email sent successfully to ${toEmail}. MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[EMAIL ERROR] Failed to send email to ${toEmail}:`, err.message);
      return { success: false, error: err.message };
    }
  } else {
    console.log(`[SIMULATION MODE] Verification code for ${toEmail} (${studentName}): ${otpCode}`);
    return { success: true, simulated: true, otp: otpCode };
  }
}

async function sendResetPasswordEmail(toEmail, studentName, otpCode) {
  const transporter = createTransporter();

  const htmlContent = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06);">
      <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 32px 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">CampusShare Hub</h1>
        <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Password Reset Request</p>
      </div>

      <div style="padding: 32px 28px; color: #1e293b;">
        <h2 style="margin: 0 0 12px 0; font-size: 18px; color: #0f172a;">Reset Your Password</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 24px 0;">
          Hello <strong>${studentName}</strong>,<br>
          We received a request to reset your password on CampusShare. Please use the 6-digit verification code below to set a new password.
        </p>

        <div style="background: #f8fafc; border: 2px dashed #cbd5e1; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
          <span style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b; display: block; margin-bottom: 8px;">Your Reset Verification Code</span>
          <div style="font-size: 36px; font-weight: 800; letter-spacing: 10px; color: #ef4444; font-family: monospace;">${otpCode}</div>
          <span style="display: inline-block; margin-top: 10px; padding: 4px 12px; background: #fef3c7; color: #92400e; border-radius: 9999px; font-size: 11px; font-weight: 700;">⏱ Valid for 5 minutes</span>
        </div>

        <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 6px; font-size: 12px; color: #78350f; margin-bottom: 24px;">
          <strong>Security Notice:</strong> If you did not request this, someone else may be trying to access your account. You can ignore this email or contact support if you have concerns.
        </div>
      </div>

      <div style="background: #f8fafc; padding: 16px 24px; text-align: center; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8;">
        © 2026 CampusShare Platform • Safe & Verified College Lending Hub
      </div>
    </div>
  `;

  if (transporter) {
    try {
      const fromAddr = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply.campushare@gmail.com';
      const info = await transporter.sendMail({
        from: `"CampusShare Password Reset" <${fromAddr}>`,
        to: toEmail,
        subject: 'Reset Your Password - CampusShare Hub',
        html: htmlContent
      });
      console.log(`[RESET EMAIL DISPATCH] Password reset email sent to ${toEmail}. MessageId: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (err) {
      console.error(`[RESET EMAIL ERROR] Failed to send reset email to ${toEmail}:`, err.message);
      return { success: false, error: err.message };
    }
  } else {
    console.log(`[RESET SIMULATION MODE] Reset code for ${toEmail} (${studentName}): ${otpCode}`);
    return { success: true, simulated: true, otp: otpCode };
  }
}

module.exports = {
  sendVerificationEmail,
  sendResetPasswordEmail
};
