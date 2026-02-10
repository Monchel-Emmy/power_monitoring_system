const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Import routes
const buildingRoutes = require('./routes/buildingRoutes');
const zoneRoutes = require('./routes/zoneRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const sensorReadingRoutes = require('./routes/sensorReadingRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const managerRoutes = require('./routes/managerRoutes');
const authRoutes = require('./routes/authRoutes');
let alertRoutes;
try {
  alertRoutes = require('./routes/alertRoutes');
} catch (err) {
  console.error('Error loading alertRoutes:', err);
  throw err;
}

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

const corsOptions = {
  origin: process.env.FRONTEND_ORIGIN || true, // true = allow all (dev); set to your Vercel URL in production
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// Use building routes
app.use('/api/buildings', buildingRoutes);
// Use zone routes
app.use('/api/zones', zoneRoutes);
// Use device routes
app.use('/api/devices', deviceRoutes);
app.use('/api/sensor-readings', sensorReadingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/manager', managerRoutes);
if (alertRoutes) {
  app.use('/api/alerts', alertRoutes);
  console.log('Alert routes registered at /api/alerts');
} else {
  console.warn('Alert routes not loaded!');
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'power-monitor-backend' });
});

// Buildings: handled by buildingRoutes (MongoDB)

// Audit log: GET/POST /api/audit-log
const auditLogRoutes = require('./routes/auditLogRoutes');
app.use('/api/audit-log', auditLogRoutes);

// Users: handled by userRoutes (GET/POST/PUT/DELETE /api/users)

// Devices: handled by deviceRoutes (in-memory CRUD)

// System configuration: GET/PUT /api/system/config
const systemConfigRoutes = require('./routes/systemConfigRoutes');
app.use('/api/system', systemConfigRoutes);

// Telemetry demo data (time-series per device)
app.get('/api/telemetry/demo', (req, res) => {
  const now = Date.now();
  const readings = Array.from({ length: 12 }).map((_, idx) => ({
    timestamp: new Date(now - (11 - idx) * 5 * 60 * 1000).toISOString(),
    deviceId: 'D001',
    powerKw: 300 + idx * 15,
    voltageV: 220 + (idx % 3),
  }));

  res.json(readings);
});

// Remove the placeholder /api/buildings route as it's now handled by buildingRoutes.js
// Remove the placeholder /api/audit-log route as it's not handled by a dedicated route file yet
// Remove the placeholder /api/users route as it's now handled by userRoutes.js
// Remove the placeholder /api/devices route as it's now handled by deviceRoutes.js

// MongoDB Connection
const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/powermonitoring'; // Replace with your actual database name
mongoose.connect(DB_URI)
.then(() => console.log('MongoDB connected successfully'))
.catch(err => console.error('MongoDB connection error:', err));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

