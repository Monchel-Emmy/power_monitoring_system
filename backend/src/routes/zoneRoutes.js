const express = require('express');
const router = express.Router();
const Zone = require('../models/Zone');
const Building = require('../models/Building'); // Needed to validate building reference

// Get all zones
router.get('/', async (req, res) => {
  try {
    const zones = await Zone.find().populate('building'); // Populate building details
    res.json(zones);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get one zone
router.get('/:id', getZone, (req, res) => {
  res.json(res.zone);
});

// Create one zone
router.post('/', async (req, res) => {
  const { name, building, floor, area, deviceCount, description } = req.body;

  // Validate if the referenced building exists
  if (building) {
    const existingBuilding = await Building.findById(building);
    if (!existingBuilding) {
      return res.status(400).json({ message: 'Building not found' });
    }
  }

  const zone = new Zone({
    name,
    building,
    floor,
    area,
    deviceCount,
    description,
  });

  try {
    const newZone = await zone.save();
    res.status(201).json(newZone);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update one zone
router.patch('/:id', getZone, async (req, res) => {
  const { name, building, floor, area, deviceCount, description } = req.body;

  if (name != null) {
    res.zone.name = name;
  }
  if (building != null) {
    // Validate if the referenced building exists
    const existingBuilding = await Building.findById(building);
    if (!existingBuilding) {
      return res.status(400).json({ message: 'Building not found' });
    }
    res.zone.building = building;
  }
  if (floor != null) {
    res.zone.floor = floor;
  }
  if (area != null) {
    res.zone.area = area;
  }
  if (deviceCount != null) {
    res.zone.deviceCount = deviceCount;
  }
  if (description != null) {
    res.zone.description = description;
  }

  try {
    const updatedZone = await res.zone.save();
    res.json(updatedZone);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete one zone
router.delete('/:id', getZone, async (req, res) => {
  try {
    await res.zone.deleteOne();
    res.json({ message: 'Deleted Zone' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

async function getZone(req, res, next) {
  let zone;
  try {
    zone = await Zone.findById(req.params.id).populate('building');
    if (zone == null) {
      return res.status(404).json({ message: 'Cannot find zone' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.zone = zone;
  next();
}

module.exports = router;