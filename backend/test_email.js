const { sendVerificationEmail } = require('./services/emailService');

async function test() {
  console.log('Sending test verification code to mahajantejas010@gmail.com...');
  const result = await sendVerificationEmail('mahajantejas010@gmail.com', 'Tejas Mahajan', '849201');
  console.log('Result:', result);
  process.exit(0);
}

test();
