const mongoose = require('mongoose');
const Building = require('./models/Building'); // Adjust path if necessary

const buildings = [
  {
    name: 'Main Campus Building A',
    address: '123 University Ave, City, Country',
    status: 'active',
    totalFloors: 5,
    totalZones: 10,
    totalDevices: 50,
    totalArea: 15000,
    zoneDistribution: [
      { zoneName: 'Ground Floor Lobby', devicesCount: 5, area: 500 },
      { zoneName: 'First Floor Offices', devicesCount: 20, area: 5000 },
    ],
  },
  {
    name: 'Research Lab Building B',
    address: '456 Research Blvd, City, Country',
    status: 'active',
    totalFloors: 3,
    totalZones: 6,
    totalDevices: 30,
    totalArea: 10000,
    zoneDistribution: [
      { zoneName: 'Lab 1', devicesCount: 10, area: 2000 },
      { zoneName: 'Lab 2', devicesCount: 10, area: 2000 },
    ],
  },
  {
    name: 'Student Dormitory C',
    address: '789 Dorms St, City, Country',
    status: 'maintenance',
    totalFloors: 8,
    totalZones: 16,
    totalDevices: 80,
    totalArea: 20000,
    zoneDistribution: [
      { zoneName: 'Common Area', devicesCount: 10, area: 1000 },
      { zoneName: 'Floor 1 Rooms', devicesCount: 20, area: 5000 },
    ],
  },
];

const seedBuildingsDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/powermonitoring');
    console.log('MongoDB connected for building seeding');

    await Building.deleteMany({});
    console.log('Existing buildings removed');

    await Building.insertMany(buildings);
    console.log('Buildings seeded successfully');

    mongoose.connection.close();
  } catch (err) {
    console.error('Error seeding buildings database:', err);
    mongoose.connection.close();
  }
};

seedBuildingsDB();