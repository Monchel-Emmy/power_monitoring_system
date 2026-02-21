/**
 * Optional: seed only buildings (homes). For full app data use: npm run seed (seed.js)
 * This script wipes all buildings and inserts Home A, B, C so you don't get campus/industrial data.
 */
const mongoose = require('mongoose');
const Building = require('./models/Building');

const zoneDistA = [
  { zoneName: 'Room 1', devicesCount: 9, area: 1667 }, { zoneName: 'Room 2', devicesCount: 3, area: 1667 },
  { zoneName: 'Room 3', devicesCount: 7, area: 1667 }, { zoneName: 'Room 4', devicesCount: 3, area: 1667 },
  { zoneName: 'Room 5', devicesCount: 9, area: 1667 }, { zoneName: 'Room 6', devicesCount: 11, area: 1667 },
  { zoneName: 'Room 7', devicesCount: 4, area: 1667 }, { zoneName: 'Room 8', devicesCount: 5, area: 1667 },
  { zoneName: 'Room 9', devicesCount: 9, area: 1667 }, { zoneName: 'Room 10', devicesCount: 3, area: 1667 },
  { zoneName: 'Room 11', devicesCount: 2, area: 1667 }, { zoneName: 'Room 12', devicesCount: 4, area: 1667 },
  { zoneName: 'Room 13', devicesCount: 6, area: 1667 }, { zoneName: 'Room 14', devicesCount: 1, area: 1667 },
  { zoneName: 'Room 15', devicesCount: 2, area: 1667 },
];
const zoneDistB = Array.from({ length: 24 }, (_, i) => ({ zoneName: `Room ${i + 1}`, devicesCount: Math.floor(72 / 24) + (i < 72 % 24 ? 1 : 0), area: 1667 }));
const zoneDistC = Array.from({ length: 9 }, (_, i) => ({ zoneName: `Room ${i + 1}`, devicesCount: Math.floor(27 / 9) + (i < 27 % 9 ? 1 : 0), area: 1667 }));

const buildings = [
  { name: 'Home A', address: '123 Main St (Home / Office)', status: 'active', totalFloors: 1, totalZones: 15, totalDevices: 45, totalArea: 25000, zoneDistribution: zoneDistA },
  { name: 'Home B', address: '456 Garden Ave (Home / Office)', status: 'active', totalFloors: 1, totalZones: 24, totalDevices: 72, totalArea: 40000, zoneDistribution: zoneDistB },
  { name: 'Home C', address: '789 Oak Blvd (Home / Office)', status: 'maintenance', totalFloors: 1, totalZones: 9, totalDevices: 27, totalArea: 15000, zoneDistribution: zoneDistC },
];

const seedBuildingsDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/powermonitoring');
    console.log('MongoDB connected for building seeding');

    await Building.deleteMany({});
    console.log('Existing buildings removed');

    await Building.insertMany(buildings);
    console.log('Buildings seeded (Home A, Home B, Home C). For full app data run: npm run seed');

    await mongoose.connection.close();
  } catch (err) {
    console.error('Error seeding buildings database:', err);
    await mongoose.connection.close();
    process.exit(1);
  }
};

seedBuildingsDB();
