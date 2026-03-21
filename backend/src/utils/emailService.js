const nodemailer = require('nodemailer');

// Create a transporter using ethereal.email for testing (or your real email service)
const createTransporter = async () => {
  // Check if we have real email credentials, otherwise use ethereal for testing
  console.log('Checking email config:', {
    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS ? 'exists' : 'missing'
  });
  
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    // Real email service (Gmail, SendGrid, etc.)
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    // Development: use ethereal.email (fake email service for testing)
    const testAccount = await nodemailer.createTestAccount();
    
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // false for STARTTLS
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }
};

// Generate a 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send verification email
const sendVerificationEmail = async (userEmail, verificationCode) => {
  try {
    const transporter = await createTransporter();
    
    const info = await transporter.sendMail({
      from: '"Power Monitoring System" <noreply@powermonitoring.com>',
      to: userEmail,
      subject: 'Verify Your Email - Power Monitoring System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb; text-align: center;">Power Monitoring System</h2>
          <div style="background: #f8fafc; padding: 30px; border-radius: 10px; text-align: center;">
            <h3 style="color: #1e293b; margin-bottom: 20px;">Email Verification</h3>
            <p style="color: #64748b; font-size: 16px; margin-bottom: 30px;">
              Thank you for signing up! Please use the verification code below to activate your account:
            </p>
            <div style="background: #2563eb; color: white; font-size: 32px; font-weight: bold; 
                        padding: 20px; border-radius: 8px; letter-spacing: 5px; margin: 20px 0;">
              ${verificationCode}
            </div>
            <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
              This code will expire in 10 minutes. If you didn't request this, please ignore this email.
            </p>
          </div>
          <div style="text-align: center; margin-top: 30px; color: #94a3b8; font-size: 12px;">
            <p>Power Monitoring System - In-House Energy Management</p>
          </div>
        </div>
      `,
    });

    console.log('Verification email sent:', info.messageId);
    
    // For development, log the URL to view the email in ethereal
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
};

module.exports = {
  createTransporter,
  generateVerificationCode,
  sendVerificationEmail,
};
