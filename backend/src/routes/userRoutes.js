const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Building = require('../models/Building');

async function resolveBuildingIds(buildingNames) {
  if (!Array.isArray(buildingNames) || buildingNames.length === 0) return [];
  const buildings = await Building.find({ name: { $in: buildingNames } }).select('_id');
  return buildings.map(b => b._id);
}

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().populate('buildings');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get a single user by ID
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('buildings');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Create a new user
router.post('/', async (req, res) => {
  const { username, password, role, email, status, buildings: buildingNames } = req.body;
  if (!username || !password || !email) {
    return res.status(400).json({ message: 'Username, password and email are required' });
  }
  const buildingIds = await resolveBuildingIds(buildingNames || []);
  const newUser = new User({
    username: username.trim(),
    password,
    email: email.trim(),
    role: (role || 'user').toLowerCase(),
    status: status || 'Active',
    buildings: buildingIds
  });

  try {
    const savedUser = await newUser.save();
    const populated = await User.findById(savedUser._id).populate('buildings');
    res.status(201).json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update a user by ID (do not overwrite password from body unless provided)
router.put('/:id', async (req, res) => {
  try {
    const { username, email, role, status, buildings: buildingNames } = req.body;
    const buildingIds = await resolveBuildingIds(buildingNames || []);
    const update = {
      username: username != null ? username.trim() : undefined,
      email: email != null ? email.trim() : undefined,
      role: role != null ? role.toLowerCase() : undefined,
      status: status != null ? status : undefined,
      buildings: buildingIds
    };
    Object.keys(update).forEach(k => update[k] === undefined && delete update[k]);
    const updatedUser = await User.findByIdAndUpdate(req.params.id, update, { new: true }).populate('buildings');
    if (updatedUser) {
      res.json(updatedUser);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete a user by ID
router.delete('/:id', async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (deletedUser) {
      res.status(204).send(); // No Content
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;