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

// Generate a secure reset token
const generateResetToken = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
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

// Send password reset email
const sendPasswordResetEmail = async (userEmail, resetToken) => {
  try {
    const transporter = await createTransporter();
    
    const frontendUrl = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(userEmail)}`;
    
    const info = await transporter.sendMail({
      from: '"Power Monitoring System" <noreply@powermonitoring.com>',
      to: userEmail,
      subject: 'Reset Your Password - Power Monitoring System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb; text-align: center;">Power Monitoring System</h2>
          <div style="background: #f8fafc; padding: 30px; border-radius: 10px; text-align: center;">
            <h3 style="color: #1e293b; margin-bottom: 20px;">Password Reset Request</h3>
            <p style="color: #64748b; font-size: 16px; margin-bottom: 30px;">
              We received a request to reset your password for your Power Monitoring account. 
              Click the button below to reset your password:
            </p>
            <div style="margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: #2563eb; color: white; font-size: 16px; font-weight: bold; 
                        padding: 12px 30px; border-radius: 8px; text-decoration: none; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p style="color: #64748b; font-size: 14px; margin-top: 30px;">
              This link will expire in 15 minutes. If you didn't request this, please ignore this email.
            </p>
            <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">
              If the button doesn't work, copy and paste this link into your browser:<br>
              <span style="word-break: break-all; color: #2563eb;">${resetUrl}</span>
            </p>
          </div>
          <div style="text-align: center; margin-top: 30px; color: #94a3b8; font-size: 12px;">
            <p>Power Monitoring System - In-House Energy Management</p>
          </div>
        </div>
      `,
    });

    console.log('Password reset email sent:', info.messageId);
    
    // For development, log the URL to view the email in ethereal
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
};

module.exports = {
  createTransporter,
  generateVerificationCode,
  generateResetToken,
  sendVerificationEmail,
  sendPasswordResetEmail,
};
