const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Import Routes
const authRoutes = require('./routes/auth.routes');
const travelRoutes = require('./routes/travel.routes');
const charterRoutes = require('./routes/charter.routes');
const packageRoutes = require('./routes/package.routes');
const cashflowRoutes = require('./routes/cashflow.routes');
const masterDataRoutes = require('./routes/masterData.routes');
const driverRoutes = require('./routes/driver.routes');
const startSeatLockCron = require('./jobs/seatLockCron');

const app = express();

// Middleware Global
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Menyajikan file statis (Uploads: Bukti pembayaran)
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// ----------------------------------------------------
// REGISTRASI ROUTES
// ----------------------------------------------------

// Route default (Beranda API) agar tidak muncul "Cannot GET /"
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to PT. Rini Trans Putri API',
    version: '1.0.0'
  });
});

// Service Routes
app.use('/api/auth', authRoutes);
app.use('/api/travel', travelRoutes);
app.use('/api/charter', charterRoutes);
app.use('/api/packages', packageRoutes);

// Admin Routes
app.use('/api/admin/cashflow', cashflowRoutes);
app.use('/api/admin/master', masterDataRoutes);

// Driver Routes
app.use('/api/driver', driverRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ status: 'error', message: 'Internal Server Error' });
});

// Hidupkan Background Tasks (Cron Jobs)
startSeatLockCron();

module.exports = app;
