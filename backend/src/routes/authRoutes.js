const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const EmailVerification = require('../models/EmailVerification');
const PasswordReset = require('../models/PasswordReset');
const { sendVerificationEmail, generateVerificationCode, sendPasswordResetEmail, generateResetToken } = require('../utils/emailService');
const { logAuditEvent, getClientIP } = require('../utils/auditLogger');

const JWT_SECRET = process.env.JWT_SECRET || 'power-monitor-secret-change-in-production';

// POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { username, password, email, role } = req.body;
    if (!username || !password || !email) {
      return res.status(400).json({ message: 'Username, password and email are required' });
    }
    const normalizedRole = (role === 'Administrator' || role === 'admin') ? 'admin' : (role === 'Building Manager' || role === 'Home & Building Manager' || role === 'manager') ? 'manager' : 'user';
    const existing = await User.findOne({ $or: [{ username: username.trim() }, { email: email.trim() }] });
    if (existing) {
      // Log duplicate signup attempt
      const ip = getClientIP(req);
      await logAuditEvent(
        username,
        'Security Events',
        'Duplicate Signup Attempt',
        `User tried to register with existing username/email: ${username} / ${email}`,
        ip,
        'warning'
      );
      return res.status(400).json({ message: 'Username or email already exists' });
    }
    const user = new User({
      username: username.trim(),
      password,
      email: email.trim(),
      role: normalizedRole,
      status: 'Pending', // Changed to Pending until email is verified
      buildings: [],
    });
    await user.save();
    
    // Generate and send verification code
    const verificationCode = generateVerificationCode();
    const emailVerification = new EmailVerification({
      email: email.trim(),
      code: verificationCode,
    });
    await emailVerification.save();
    
    // Send verification email
    const emailSent = await sendVerificationEmail(email, verificationCode);
    
    // For development/production issues, also return the code if email fails
    if (!emailSent) {
      console.log('Email failed, returning code for testing:', verificationCode);
      return res.status(200).json({ 
        message: 'Verification code sent (email service unavailable)',
        verificationCode: verificationCode, // Only for testing
        emailFallback: true 
      });
    }
    
    // Log successful signup
    const ip = getClientIP(req);
    await logAuditEvent(
      username,
      'User Actions',
      'User Signup',
      `New user registered with email: ${email}, role: ${normalizedRole}, verification sent: ${emailSent}`,
      ip,
      'success'
    );
    
    res.status(201).json({
      message: 'Account created successfully! Please check your email for verification code.',
      email: email.trim(),
      requiresVerification: true,
    });
  } catch (err) {
    // Log failed signup
    const ip = getClientIP(req);
    await logAuditEvent(
      username || 'unknown',
      'Security Events',
      'Signup Failed',
      `Failed signup attempt: ${err.message}`,
      ip,
      'error'
    );
    res.status(500).json({ message: err.message || 'Signup failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    const user = await User.findOne({ email: email.trim() });
    if (!user) {
      // Log failed login - user not found
      const ip = getClientIP(req);
      await logAuditEvent(
        email,
        'Security Events',
        'Login Failed',
        'Login attempt with non-existent email',
        ip,
        'error'
      );
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      // Log failed login - wrong password
      const ip = getClientIP(req);
      await logAuditEvent(
        email,
        'Security Events',
        'Login Failed',
        'Login attempt with incorrect password',
        ip,
        'error'
      );
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({ 
        message: 'Please verify your email before logging in. Check your inbox for verification code.',
        requiresVerification: true,
        email: user.email,
      });
    }
    
    const requestedRole = (role === 'Administrator' || role === 'admin') ? 'admin' : (role === 'Building Manager' || role === 'Home & Building Manager' || role === 'manager') ? 'manager' : null;
    if (requestedRole && user.role !== requestedRole) {
      // Log role access denied
      const ip = getClientIP(req);
      await logAuditEvent(
        email,
        'Security Events',
        'Access Denied',
        `User tried to access ${requestedRole} role but has ${user.role} role`,
        ip,
        'warning'
      );
      return res.status(403).json({ message: 'Access denied for this role' });
    }
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    // Log successful login
    const ip = getClientIP(req);
    await logAuditEvent(
      email,
      'User Actions',
      'User Login',
      `User logged in successfully with role: ${user.role}`,
      ip,
      'success'
    );
    
    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    // Log general login error
    const ip = getClientIP(req);
    await logAuditEvent(
      username || 'unknown',
      'Security Events',
      'Login Error',
      `Login system error: ${err.message}`,
      ip,
      'error'
    );
    res.status(500).json({ message: err.message || 'Login failed' });
  }
});

// POST /api/auth/verify-email
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;
    
    if (!email || !code) {
      return res.status(400).json({ message: 'Email and verification code are required' });
    }
    
    // Find the verification record
    const verification = await EmailVerification.findOne({ 
      email: email.trim().toLowerCase(), 
      code: code.trim() 
    });
    
    if (!verification) {
      return res.status(400).json({ message: 'Invalid verification code' });
    }
    
    if (!verification.isValid()) {
      return res.status(400).json({ message: 'Verification code has expired or been used' });
    }
    
    // Mark verification as used
    verification.isUsed = true;
    await verification.save();
    
    // Activate the user account
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.status = 'Active';
    user.isEmailVerified = true;
    await user.save();
    
    // Log successful verification
    const ip = getClientIP(req);
    await logAuditEvent(
      email,
      'User Actions',
      'Email Verified',
      `Email verification completed successfully`,
      ip,
      'success'
    );
    
    res.json({
      message: 'Email verified successfully! You can now login.',
      verified: true,
    });
  } catch (err) {
    console.error('Email verification error:', err);
    res.status(500).json({ message: 'Email verification failed' });
  }
});

// POST /api/auth/resend-verification
router.post('/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }
    
    // Delete any existing verification codes
    await EmailVerification.deleteMany({ email: email.trim().toLowerCase() });
    
    // Generate and send new verification code
    const verificationCode = generateVerificationCode();
    const emailVerification = new EmailVerification({
      email: email.trim().toLowerCase(),
      code: verificationCode,
    });
    await emailVerification.save();
    
    const emailSent = await sendVerificationEmail(email.trim().toLowerCase(), verificationCode);
    
    res.json({
      message: 'Verification code sent to your email.',
      emailSent,
    });
  } catch (err) {
    console.error('Resend verification error:', err);
    res.status(500).json({ message: 'Failed to resend verification code' });
  }
});

// GET /api/auth/me (optional - verify token)
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    User.findById(decoded.id)
      .select('username email role')
      .then((user) => {
        if (!user) return res.status(401).json({ message: 'User not found' });
        res.json({ user: { id: user._id, username: user.username, email: user.email, role: user.role } });
      })
      .catch(() => res.status(401).json({ message: 'Invalid token' }));
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }
    
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    
    // Always return success to prevent email enumeration attacks
    if (!user) {
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }
    
    // Google OAuth users don't have passwords, so they can't reset them
    if (user.googleId && !user.password) {
      return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
    }
    
    // Delete any existing reset tokens for this email
    await PasswordReset.deleteMany({ email: email.trim().toLowerCase() });
    
    // Generate reset token
    const resetToken = generateResetToken();
    const passwordReset = new PasswordReset({
      email: email.trim().toLowerCase(),
      token: resetToken,
    });
    await passwordReset.save();
    
    // Send reset email
    const emailSent = await sendPasswordResetEmail(email.trim().toLowerCase(), resetToken);
    
    // Log password reset request
    const ip = getClientIP(req);
    await logAuditEvent(
      email,
      'Security Events',
      'Password Reset Request',
      `Password reset requested for account`,
      ip,
      'info'
    );
    
    res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Failed to process password reset request' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;
    
    if (!token || !email || !newPassword) {
      return res.status(400).json({ message: 'Token, email, and new password are required' });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long' });
    }
    
    // Find the reset token
    const resetRecord = await PasswordReset.findOne({ 
      email: email.trim().toLowerCase(), 
      token: token.trim() 
    });
    
    if (!resetRecord || !resetRecord.isValid()) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }
    
    // Find the user
    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    // Mark token as used
    resetRecord.isUsed = true;
    await resetRecord.save();
    
    // Log successful password reset
    const ip = getClientIP(req);
    await logAuditEvent(
      email,
      'Security Events',
      'Password Reset Successful',
      `Password was successfully reset for account`,
      ip,
      'success'
    );
    
    res.json({ message: 'Password has been reset successfully. You can now login with your new password.' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Failed to reset password' });
  }
});

// Debug endpoint to test email service
router.get('/test-email', async (req, res) => {
  try {
    console.log('Testing email service...');
    console.log('EMAIL_HOST:', process.env.EMAIL_HOST);
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('EMAIL_PASS exists:', !!process.env.EMAIL_PASS);
    
    const emailSent = await sendVerificationEmail('test@example.com', '123456');
    
    res.json({
      message: 'Email test completed',
      emailConfigured: !!process.env.EMAIL_HOST && !!process.env.EMAIL_USER && !!process.env.EMAIL_PASS,
      emailService: emailSent
    });
  } catch (error) {
    console.error('Email test error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
