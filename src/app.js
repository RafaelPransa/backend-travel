const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Import Routes
const authRoutes = require('./routes/auth.routes');
const travelRoutes = require('./routes/travel.routes');
const charterRoutes = require('./routes/charter.routes');
const packageRoutes = require('./routes/package.routes');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json()); // Parsing application/json
app.use(express.urlencoded({ extended: true })); // Parsing application/x-www-form-urlencoded

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

app.use('/api/auth', authRoutes);
app.use('/api/travel', travelRoutes);
app.use('/api/charter', charterRoutes);
app.use('/api/packages', packageRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: 'Terjadi kesalahan internal pada server'
  });
});

module.exports = app;
