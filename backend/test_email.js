require('dotenv').config();
const { sendVerificationEmail } = require('./services/emailService');

const targetEmail = process.argv[2] || process.env.EMAIL_USER;
if (!targetEmail) {
  console.log('Usage: node backend/test_email.js your_email@gmail.com');
  process.exit(1);
}

console.log('Attempting to send real verification email to: ' + targetEmail + '...');
sendVerificationEmail(targetEmail, 'Campus Student', '582914')
  .then(res => {
    if (res.success && !res.simulated) {
      console.log('✅ SUCCESS! Real email sent successfully. MessageId: ' + res.messageId);
      console.log('Check the inbox of ' + targetEmail + ' (and spam folder if not in primary).');
    } else if (res.simulated) {
      console.log('⚠️ SIMULATION MODE: SMTP credentials (EMAIL_USER and EMAIL_PASS) are not set in backend/.env.');
    } else {
      console.log('❌ FAILED TO SEND EMAIL: ' + res.error);
    }
  })
  .catch(err => console.error('❌ Error:', err));
