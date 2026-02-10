const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Building = require('./models/Building');
const Device = require('./models/Device');
const AuditLog = require('./models/AuditLog');
const SensorReading = require('./models/SensorReading');
const Alert = require('./models/Alert');

dotenv.config();

const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/powermonitoring';

const BUILDING_NAMES = ['Building A', 'Building B', 'Building C'];

const zoneDistA = [
  { zoneName: 'Zone 1', devicesCount: 9, area: 1667 }, { zoneName: 'Zone 2', devicesCount: 3, area: 1667 },
  { zoneName: 'Zone 3', devicesCount: 7, area: 1667 }, { zoneName: 'Zone 4', devicesCount: 3, area: 1667 },
  { zoneName: 'Zone 5', devicesCount: 9, area: 1667 }, { zoneName: 'Zone 6', devicesCount: 11, area: 1667 },
  { zoneName: 'Zone 7', devicesCount: 4, area: 1667 }, { zoneName: 'Zone 8', devicesCount: 5, area: 1667 },
  { zoneName: 'Zone 9', devicesCount: 9, area: 1667 }, { zoneName: 'Zone 10', devicesCount: 3, area: 1667 },
  { zoneName: 'Zone 11', devicesCount: 2, area: 1667 }, { zoneName: 'Zone 12', devicesCount: 4, area: 1667 },
  { zoneName: 'Zone 13', devicesCount: 6, area: 1667 }, { zoneName: 'Zone 14', devicesCount: 1, area: 1667 },
  { zoneName: 'Zone 15', devicesCount: 2, area: 1667 },
];
const zoneDistB = Array.from({ length: 24 }, (_, i) => ({ zoneName: `Zone ${i + 1}`, devicesCount: Math.floor(72 / 24) + (i < 72 % 24 ? 1 : 0), area: 1667 }));
const zoneDistC = Array.from({ length: 9 }, (_, i) => ({ zoneName: `Zone ${i + 1}`, devicesCount: Math.floor(27 / 9) + (i < 27 % 9 ? 1 : 0), area: 1667 }));

const buildingsData = [
  { name: 'Building A', address: '123 Industrial Ave, Tech Park', status: 'active', totalFloors: 5, totalZones: 15, totalDevices: 45, totalArea: 25000, zoneDistribution: zoneDistA },
  { name: 'Building B', address: '456 Commerce St, Business District', status: 'active', totalFloors: 8, totalZones: 24, totalDevices: 72, totalArea: 40000, zoneDistribution: zoneDistB },
  { name: 'Building C', address: '789 Innovation Blvd, Innovation Hub', status: 'maintenance', totalFloors: 3, totalZones: 9, totalDevices: 27, totalArea: 15000, zoneDistribution: zoneDistC },
];

const seedDB = async () => {
  try {
    await mongoose.connect(DB_URI);
    console.log('MongoDB connected for seeding');

    // 1) Ensure buildings "Building A", "Building B", "Building C" exist
    await Building.deleteMany({ name: { $in: BUILDING_NAMES } });
    const insertedBuildings = await Building.insertMany(buildingsData);
    console.log('Buildings seeded:', insertedBuildings.map(b => b.name).join(', '));

    // 2) Seed users (clear existing first)
    await User.deleteMany({});
    const [buildingA, buildingB, buildingC] = insertedBuildings;

    const hashed = await bcrypt.hash('password123', 10);
    const users = [
      {
        username: 'alice.smith',
        password: hashed,
        role: 'admin',
        email: 'alice.smith@example.com',
        status: 'Active',
        buildings: [buildingA._id, buildingB._id],
      },
      {
        username: 'bob.johnson',
        password: hashed,
        role: 'manager',
        email: 'bob.johnson@example.com',
        status: 'Active',
        buildings: [buildingC._id],
      },
      {
        username: 'charlie.brown',
        password: hashed,
        role: 'user',
        email: 'charlie.brown@example.com',
        status: 'Active',
        buildings: [buildingA._id],
      },
    ];

    await User.insertMany(users);
    console.log('Users seeded:', users.length);

    // 3) Seed devices (clear and insert sample devices)
    // Drop legacy index from old Device schema (deviceId) so inserts with new "id" field succeed
    try {
      await Device.collection.dropIndex('deviceId_1');
      console.log('Dropped legacy index deviceId_1');
    } catch (e) {
      if (e.code !== 27 && e.codeName !== 'IndexNotFound') console.warn('Index drop (optional):', e.message);
    }
    await Device.deleteMany({});
    const devicesData = [
      { id: 'D001', name: 'Power Meter A1', type: 'Smart Meter', location: 'Building A - Floor 1', lastSync: '2 minutes ago', dataRate: '1.2 MB/s', battery: '95%', status: 'Online' },
      { id: 'D002', name: 'Power Meter A2', type: 'Smart Meter', location: 'Building A - Floor 2', lastSync: '1 minute ago', dataRate: '1.1 MB/s', battery: '88%', status: 'Online' },
      { id: 'D003', name: 'Sensor B1', type: 'IoT Sensor', location: 'Building B - Floor 1', lastSync: '15 minutes ago', dataRate: '0.8 MB/s', battery: '45%', status: 'Warning' },
      { id: 'D004', name: 'Smart Plug C1', type: 'Smart Meter', location: 'Building C - Floor 1', lastSync: '3 minutes ago', dataRate: '1.3 MB/s', battery: '92%', status: 'Online' },
      { id: 'D005', name: 'Sensor A3', type: 'IoT Sensor', location: 'Building A - Floor 3', lastSync: '2 hours ago', dataRate: 'N/A', battery: '12%', status: 'Offline' },
    ];
    await Device.insertMany(devicesData);
    console.log('Devices seeded:', devicesData.length);

    // 4) Seed audit log
    await AuditLog.deleteMany({});
    const auditData = [
      { timestamp: '2025-11-26 14:32:15', user: 'John Admin', category: 'User Actions', action: 'User Created', details: 'Created new user "Mike Johnson"', ip: '192.168.1.101', status: 'success' },
      { timestamp: '2025-11-26 14:15:08', user: 'Sarah Manager', category: 'Device Changes', action: 'Device Updated', details: 'Updated configuration for device D003', ip: '192.168.1.105', status: 'success' },
      { timestamp: '2025-11-26 13:58:42', user: 'John Admin', category: 'System Events', action: 'System Config Changed', details: 'Modified backup frequency to daily', ip: '192.168.1.100', status: 'success' },
      { timestamp: '2025-11-26 13:45:22', user: 'Unknown', category: 'Security Events', action: 'Failed Login Attempt', details: 'Multiple failed login attempts detected', ip: '203.45.67.89', status: 'warning' },
      { timestamp: '2025-11-26 12:20:00', user: 'Alice Smith', category: 'User Actions', action: 'User Login', details: 'Successful login', ip: '192.168.1.50', status: 'success' },
    ];
    await AuditLog.insertMany(auditData);
    console.log('Audit log seeded:', auditData.length);

    // 5) Seed power-meter IoT demo data (sensor readings)
    await SensorReading.deleteMany({});
    const devices = await Device.find().lean();
    const now = new Date();
    const sensorReadings = [];
    // Generate hourly readings for last 48h per device (simulates IoT power meter data)
    for (const dev of devices) {
      for (let h = 48; h >= 0; h--) {
        const ts = new Date(now);
        ts.setHours(ts.getHours() - h, 0, 0, 0);
        const baseKw = 50 + Math.floor(Math.random() * 120);
        const hourOfDay = ts.getHours();
        const peakBoost = (hourOfDay >= 9 && hourOfDay <= 18) ? 1.3 : 0.8;
        const powerKw = Math.round((baseKw * peakBoost + (Math.random() * 20)) * 10) / 10;
        const voltage = 218 + Math.round(Math.random() * 8);
        const current = Math.round((powerKw * 1000 / voltage) * 10) / 10;
        sensorReadings.push({
          device: dev._id,
          timestamp: ts,
          powerConsumption: powerKw,
          voltage,
          current,
        });
      }
    }
    await SensorReading.insertMany(sensorReadings);
    console.log('Sensor readings (IoT power meter demo) seeded:', sensorReadings.length);

    // 6) Seed alerts
    await Alert.deleteMany({});
    const devicesForAlerts = await Device.find().lean();
    const deviceA3 = devicesForAlerts.find((d) => d.id === 'D005');
    const deviceB1 = devicesForAlerts.find((d) => d.id === 'D003');
    const alertsData = [
      {
        timestamp: new Date(now.getTime() - 2 * 60 * 60 * 1000),
        building: 'Building A',
        device: deviceA3?._id,
        type: 'Device Offline',
        severity: 'High',
        status: 'Open',
        message: 'Device Sensor A3 has been offline for 2 hours',
      },
      {
        timestamp: new Date(now.getTime() - 4 * 60 * 60 * 1000),
        building: 'Building B',
        device: deviceB1?._id,
        type: 'Battery Low',
        severity: 'Medium',
        status: 'Investigating',
        message: 'Device Sensor B1 battery level at 45%',
        value: 45,
        threshold: 50,
      },
      {
        timestamp: new Date(now.getTime() - 6 * 60 * 60 * 1000),
        building: 'Building A',
        type: 'High Consumption',
        severity: 'High',
        status: 'Acknowledged',
        message: 'Power consumption exceeded threshold by 15%',
        value: 425,
        threshold: 370,
      },
      {
        timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        building: 'Building C',
        type: 'Voltage Anomaly',
        severity: 'High',
        status: 'Resolved',
        message: 'Voltage spike detected and resolved',
        value: 245,
        threshold: 240,
      },
      {
        timestamp: new Date(now.getTime() - 36 * 60 * 60 * 1000),
        building: 'Building A',
        type: 'Threshold Breach',
        severity: 'Low',
        status: 'Resolved',
        message: 'Minor threshold breach - auto-resolved',
        value: 385,
        threshold: 380,
      },
    ];
    await Alert.insertMany(alertsData);
    console.log('Alerts seeded:', alertsData.length);

    await mongoose.connection.close();
    console.log('Seed done. Users, Buildings, Devices, Audit log, Sensor readings, Alerts ready.');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
};

seedDB();
