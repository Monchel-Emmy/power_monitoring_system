const nodemailer = require('nodemailer');

// Create a transporter using ethereal.email for testing (or your real email service)
const createTransporter = async () => {
  console.log('Checking email config:', {
    EMAIL_HOST: process.env.EMAIL_HOST,
    EMAIL_USER: process.env.EMAIL_USER,
    EMAIL_PASS: process.env.EMAIL_PASS ? 'exists' : 'missing'
  });
  
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } else {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
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

// Send alert notification email
const sendAlertEmail = async (toEmail, alert) => {
  try {
    const transporter = await createTransporter();

    const severityColors = { High: '#dc2626', Medium: '#d97706', Low: '#2563eb' };
    const severityBg    = { High: '#fee2e2', Medium: '#fef3c7', Low: '#dbeafe' };
    const color = severityColors[alert.severity] || '#374151';
    const bg    = severityBg[alert.severity]    || '#f3f4f6';

    const formattedTime = new Date(alert.timestamp).toLocaleString('en-US', {
      weekday: 'short', year: 'numeric', month: 'short',
      day: '2-digit', hour: '2-digit', minute: '2-digit',
    });

    const device   = alert.device || {};
    const devName  = device.name     || '—';
    const devRoom  = device.room     || device.location || '—';
    const devHome  = device.building || alert.building  || '—';
    const devType  = device.type     || '—';
    const devStatus = device.status  || '—';

    const row = (label, value) => `
      <tr>
        <td style="padding:8px 0;color:#64748b;font-size:13px;width:150px;vertical-align:top;">${label}</td>
        <td style="padding:8px 0;color:#1e293b;font-size:13px;font-weight:600;">${value}</td>
      </tr>`;

    const info = await transporter.sendMail({
      from: '"Power Monitoring System" <noreply@powermonitoring.com>',
      to: toEmail,
      subject: `[${alert.severity} Alert] High Power on ${devName} — ${devHome}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:580px;margin:0 auto;background:#f8fafc;padding:20px;">

          <!-- Header -->
          <div style="background:#1e293b;padding:22px 28px;border-radius:12px 12px 0 0;">
            <h2 style="color:#fff;margin:0;font-size:18px;">⚡ Power Monitoring System</h2>
            <p style="color:#94a3b8;margin:4px 0 0;font-size:12px;">Automated Alert Notification</p>
          </div>

          <!-- Body -->
          <div style="background:#fff;padding:26px 28px;border-radius:0 0 12px 12px;border:1px solid #e2e8f0;border-top:none;">

            <!-- Severity banner -->
            <div style="background:${bg};border-left:4px solid ${color};padding:12px 16px;border-radius:6px;margin-bottom:22px;">
              <span style="color:${color};font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.06em;">
                ${alert.severity} Severity — High Consumption Alert
              </span>
              <p style="margin:6px 0 0;color:#1e293b;font-size:15px;font-weight:700;">
                ${devName} reported <span style="color:${color};">${alert.value} kW</span>
                &nbsp;(threshold: ${alert.threshold} kW)
              </p>
            </div>

            <!-- Device details table -->
            <table style="width:100%;border-collapse:collapse;">
              ${row('Device', devName)}
              ${row('Type', devType)}
              ${row('Location', devRoom)}
              ${row('Home / Building', devHome)}
              ${row('Device Status', devStatus)}
              ${row('Power Reading', `<span style="color:${color};font-size:15px;">${alert.value} kW</span>`)}
              ${row('Threshold', `${alert.threshold} kW`)}
              ${row('Exceeded by', `<span style="color:${color};">${(alert.value - alert.threshold).toFixed(1)} kW above limit</span>`)}
              ${row('Time', formattedTime)}
              ${row('Alert Status', 'Open — Requires Attention')}
            </table>

            <!-- Message -->
            <div style="margin-top:20px;padding:12px 16px;background:#f1f5f9;border-radius:8px;font-size:13px;color:#475569;line-height:1.6;">
              ${alert.message}
            </div>

            <p style="margin-top:20px;font-size:13px;color:#64748b;">
              Please log in to the Power Monitoring System to investigate and resolve this alert.
            </p>
          </div>

          <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:14px;">
            Power Monitoring System — Automated Alert · Do not reply to this email
          </p>
        </div>
      `,
    });

    console.log('Alert email sent:', info.messageId);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) console.log('Preview URL:', previewUrl);
    return true;
  } catch (error) {
    console.error('Error sending alert email:', error);
    return false;
  }
};

module.exports = {
  createTransporter,
  generateVerificationCode,
  generateResetToken,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendAlertEmail,
};
