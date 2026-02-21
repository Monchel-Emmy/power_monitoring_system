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

// Generate default zone distribution (Room 1, Room 2, ...) when not provided
function buildZoneDistribution(totalZones, totalDevices = 0, provided = []) {
  if (provided && provided.length > 0) return provided;
  const zones = [];
  const avg = totalZones > 0 ? Math.floor(totalDevices / totalZones) : 0;
  let remainder = totalDevices - avg * totalZones;
  for (let i = 1; i <= (totalZones || 0); i++) {
    const count = avg + (remainder-- > 0 ? 1 : 0);
    zones.push({ zoneName: `Room ${i}`, devicesCount: count, area: 0 });
  }
  return zones;
}

// Sync zoneDistribution to match totalZones: trim (merge devices into last) or extend with new rooms
function syncZoneDistribution(totalZones, totalDevices, currentDist = []) {
  const n = Math.max(0, Number(totalZones) || 0);
  const targetDevices = Math.max(0, Number(totalDevices) || 0);
  const current = Array.isArray(currentDist) ? currentDist : [];
  if (n === 0) return [];
  if (n >= current.length) {
    const result = current.map((z) => ({ zoneName: z.zoneName || 'Room', devicesCount: z.devicesCount ?? 0, area: z.area ?? 0 }));
    const existingDevices = result.reduce((s, z) => s + (z.devicesCount || 0), 0);
    let remainder = targetDevices - existingDevices;
    for (let i = current.length; i < n; i++) {
      const count = remainder > 0 ? Math.min(remainder, Math.ceil(remainder / (n - i))) : 0;
      remainder -= count;
      result.push({ zoneName: `Room ${i + 1}`, devicesCount: count, area: 0 });
    }
    return result;
  }
  const kept = current.slice(0, n);
  const removed = current.slice(n);
  const mergedDevices = removed.reduce((s, z) => s + (z.devicesCount ?? 0), 0);
  const result = kept.map((z, i) => ({
    zoneName: z.zoneName || `Room ${i + 1}`,
    devicesCount: (z.devicesCount ?? 0) + (i === n - 1 ? mergedDevices : 0),
    area: z.area ?? 0,
  }));
  if (result.length && targetDevices !== undefined) {
    const sum = result.reduce((s, z) => s + (z.devicesCount || 0), 0);
    if (sum !== targetDevices) result[result.length - 1].devicesCount = Math.max(0, (result[result.length - 1].devicesCount || 0) + (targetDevices - sum));
  }
  return result;
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
  if (ta != null) res.building.totalArea = Number(ta) || 0;

  if (Array.isArray(b.zoneDistribution) && b.zoneDistribution.length > 0) {
    res.building.zoneDistribution = b.zoneDistribution.map((z) => ({
      zoneName: (z.zoneName || '').trim() || 'Room',
      devicesCount: Math.max(0, Number(z.devicesCount) || 0),
      area: Math.max(0, Number(z.area) || 0),
    }));
    res.building.totalZones = res.building.zoneDistribution.length;
    res.building.totalDevices = res.building.zoneDistribution.reduce((s, z) => s + (z.devicesCount || 0), 0);
  } else if (tz != null || td != null) {
    const newZones = Number(tz) ?? res.building.totalZones ?? 0;
    const newDevices = Number(td) ?? res.building.totalDevices ?? 0;
    res.building.zoneDistribution = syncZoneDistribution(newZones, newDevices, res.building.zoneDistribution);
    res.building.totalZones = res.building.zoneDistribution.length;
    res.building.totalDevices = res.building.zoneDistribution.reduce((s, z) => s + (z.devicesCount || 0), 0);
  }

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
  if (typeof next === 'function') next();
  else res.json(res.building);
}

module.exports = router;