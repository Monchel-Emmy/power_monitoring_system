const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
      return res.status(400).json({ message: 'Username or email already exists' });
    }
    const user = new User({
      username: username.trim(),
      password,
      email: email.trim(),
      role: normalizedRole,
      status: 'Active',
      buildings: [],
    });
    await user.save();
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message || 'Signup failed' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }
    const user = await User.findOne({ username: username.trim() });
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    const requestedRole = (role === 'Administrator' || role === 'admin') ? 'admin' : (role === 'Building Manager' || role === 'Home & Building Manager' || role === 'manager') ? 'manager' : null;
    if (requestedRole && user.role !== requestedRole) {
      return res.status(403).json({ message: 'You do not have access for the selected role' });
    }
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
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
    res.status(500).json({ message: err.message || 'Login failed' });
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

module.exports = router;
