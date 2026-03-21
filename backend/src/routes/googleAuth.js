const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { logAuditEvent, getClientIP } = require('../utils/auditLogger');

const router = express.Router();

// Google OAuth routes
router.get('/', passport.authenticate('google', { 
  scope: ['profile', 'email'],
  prompt: 'select_account' // Force account selection
}));

router.get('/callback', 
  passport.authenticate('google', { failureRedirect: '/login?error=google-auth-failed' }),
  async (req, res) => {
    try {
      // Generate JWT token
      const token = jwt.sign(
        { id: req.user._id, role: req.user.role },
        process.env.JWT_SECRET || 'power-monitor-secret-change-in-production',
        { expiresIn: '7d' }
      );

      // Log successful Google login
      await logAuditEvent(
        req.user.email,
        'User Actions',
        'Google OAuth Login',
        `User logged in successfully via Google OAuth with role: ${req.user.role}`,
        getClientIP(req),
        'success'
      );

      // Redirect to frontend with token and user data
      const redirectUrl = req.user.role === 'admin' 
        ? `http://localhost:3000/auth-success?token=${token}&role=admin&username=${encodeURIComponent(req.user.username)}&email=${encodeURIComponent(req.user.email)}`
        : `http://localhost:3000/auth-success?token=${token}&role=manager&username=${encodeURIComponent(req.user.username)}&email=${encodeURIComponent(req.user.email)}`;
      
      res.redirect(redirectUrl);
    } catch (error) {
      console.error('Google OAuth callback error:', error);
      res.redirect('/login?error=server-error');
    }
  }
);

module.exports = router;
