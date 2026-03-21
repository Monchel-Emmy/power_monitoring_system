require('dotenv').config();
const { sendVerificationEmail } = require('./src/utils/emailService');

sendVerificationEmail('tuyisengeemmanuel1999@gmail.com', '123456')
  .then(result => {
    console.log('Email sent result:', result);
    process.exit(0);
  })
  .catch(err => {
    console.error('Email sending error:', err);
    process.exit(1);
  });
