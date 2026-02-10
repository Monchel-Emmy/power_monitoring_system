const express = require('express');
const router = express.Router();
const Building = require('../models/Building');

// Get all buildings
router.get('/', async (req, res) => {
  try {
    const buildings = await Building.find();
    res.json(buildings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get one building
router.get('/:id', getBuilding, (req, res) => {
  res.json(res.building);
});

// Generate default zone distribution (Zone 1, Zone 2, ...) when not provided
function buildZoneDistribution(totalZones, totalDevices = 0, provided = []) {
  if (provided && provided.length > 0) return provided;
  const zones = [];
  const avg = totalZones > 0 ? Math.floor(totalDevices / totalZones) : 0;
  let remainder = totalDevices - avg * totalZones;
  for (let i = 1; i <= (totalZones || 0); i++) {
    const count = avg + (remainder-- > 0 ? 1 : 0);
    zones.push({ zoneName: `Zone ${i}`, devicesCount: count, area: 0 });
  }
  return zones;
}

// Create one building
router.post('/', async (req, res) => {
  const totalFloors = req.body.totalFloors ?? req.body.floors ?? 1;
  const totalZones = req.body.totalZones ?? req.body.zones ?? 0;
  const totalDevices = req.body.totalDevices ?? req.body.devices ?? 0;
  const totalArea = req.body.totalArea ?? req.body.area ?? 0;
  const zoneDistribution = buildZoneDistribution(totalZones, totalDevices, req.body.zoneDistribution);

  const building = new Building({
    name: (req.body.name || '').trim(),
    address: (req.body.address || '').trim(),
    status: req.body.status || 'active',
    totalFloors: Number(totalFloors) || 1,
    totalZones: Number(totalZones) || 0,
    totalDevices: Number(totalDevices) || 0,
    totalArea: Number(totalArea) || 0,
    zoneDistribution,
  });

  try {
    const newBuilding = await building.save();
    res.status(201).json(newBuilding);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Update one building (PATCH or PUT)
const updateBuildingHandler = async (req, res) => {
  const b = req.body;
  if (b.name != null) res.building.name = b.name.trim();
  if (b.address != null) res.building.address = b.address.trim();
  if (b.status != null) res.building.status = b.status;
  const tf = b.totalFloors ?? b.floors;
  const tz = b.totalZones ?? b.zones;
  const td = b.totalDevices ?? b.devices;
  const ta = b.totalArea ?? b.area;
  if (tf != null) res.building.totalFloors = Number(tf) || 1;
  if (tz != null) res.building.totalZones = Number(tz) || 0;
  if (td != null) res.building.totalDevices = Number(td) || 0;
  if (ta != null) res.building.totalArea = Number(ta) || 0;
  if (b.zoneDistribution != null) res.building.zoneDistribution = b.zoneDistribution;
  try {
    const updated = await res.building.save();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

router.patch('/:id', getBuilding, updateBuildingHandler);
router.put('/:id', getBuilding, updateBuildingHandler);

// Delete one building
router.delete('/:id', getBuilding, async (req, res) => {
  try {
    await res.building.deleteOne();
    res.json({ message: 'Deleted Building' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

async function getBuilding(req, res, next) {
  let building;
  try {
    building = await Building.findById(req.params.id);
    if (building == null) {
      return res.status(404).json({ message: 'Cannot find building' });
    }
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }

  res.building = building;
  next();
}

module.exports = router;