const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import Routes
const authRoutes = require('./routes/auth.routes');
const travelRoutes = require('./routes/travel.routes');
const charterRoutes = require('./routes/charter.routes');
const packageRoutes = require('./routes/package.routes');
const cashflowRoutes = require('./routes/cashflow.routes');
const masterDataRoutes = require('./routes/masterData.routes');
const driverRoutes = require('./routes/driver.routes');
const mechanicRoutes = require('./routes/mechanic.routes');
const startSeatLockCron = require('./jobs/seatLockCron');

const app = express();

// ============================================================
// MIDDLEWARE KEAMANAN GLOBAL
// ============================================================

// Proteksi header HTTP (XSS, Clickjacking, MIME Sniffing, dll.)
app.use(helmet());

// CORS: Hanya izinkan origin yang terdaftar (bukan wildcard *)
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:5173'];

app.use(cors({
  origin: function (origin, callback) {
    // Izinkan request tanpa origin (Postman, curl, mobile app)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Akses ditolak oleh CORS policy'));
  },
  credentials: true
}));

// Batasi ukuran request body agar tidak bisa di-DoS dengan payload besar
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Rate Limiter Global: Maksimal 100 request per 15 menit per IP
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Terlalu banyak permintaan dari IP ini. Silakan coba lagi setelah 15 menit.'
  }
});

// Rate Limiter khusus Auth: Maksimal 10 percobaan login per 15 menit per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 'error',
    message: 'Terlalu banyak percobaan login. Silakan coba lagi setelah 15 menit.'
  }
});

// Menyajikan file statis (Uploads: Bukti pembayaran)
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// ============================================================
// REGISTRASI ROUTES
// ============================================================

// Route default (Beranda API) agar tidak muncul "Cannot GET /"
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to PT. Rini Trans Putri API',
    version: '1.0.0'
  });
});

// Auth Routes (Dengan rate limiter khusus anti brute-force)
app.use('/api/auth', authLimiter, authRoutes);

// Service Routes (Dengan rate limiter global)
app.use('/api/travel', globalLimiter, travelRoutes);
app.use('/api/charter', globalLimiter, charterRoutes);
app.use('/api/packages', globalLimiter, packageRoutes);

// Admin Routes
app.use('/api/admin/cashflow', globalLimiter, cashflowRoutes);
app.use('/api/admin/master', globalLimiter, masterDataRoutes);

// Driver Routes
app.use('/api/driver', globalLimiter, driverRoutes);

// Mechanic Routes
app.use('/api/mechanic', globalLimiter, mechanicRoutes);

// ============================================================
// GLOBAL ERROR HANDLER
// ============================================================
app.use((err, req, res, next) => {
  // Tangani error dari Multer (file terlalu besar / format salah)
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ status: 'error', message: 'Ukuran file terlalu besar. Maksimal 5MB.' });
    }
    return res.status(400).json({ status: 'error', message: err.message });
  }

  // Tangani error CORS
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({ status: 'error', message: 'Akses ditolak oleh CORS policy' });
  }

  // Tangani error dari Multer file filter
  if (err.message && err.message.includes('Format file tidak didukung')) {
    return res.status(400).json({ status: 'error', message: err.message });
  }

  // Error generik (jangan pernah bocorkan detail error ke client di production)
  console.error(err.stack);
  res.status(500).json({ status: 'error', message: 'Internal Server Error' });
});

// Hidupkan Background Tasks (Cron Jobs)
startSeatLockCron();

module.exports = app;
