const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// Import Routes
const authRoutes = require('./routes/auth.routes');
const travelRoutes = require('./routes/travel.routes');
const charterRoutes = require('./routes/charter.routes');
const packageRoutes = require('./routes/package.routes');
const cashflowRoutes = require('./routes/cashflow.routes');
const masterDataRoutes = require('./routes/masterData.routes');
const driverRoutes = require('./routes/driver.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const assignmentRoutes = require('./routes/assignment.routes');
const contentRoutes = require('./routes/content.routes');
const cmsRoutes = require('./routes/cms.routes');
const startSeatLockCron = require('./jobs/seatLockCron');

const app = express();

// ============================================================
// MIDDLEWARE KEAMANAN GLOBAL
// ============================================================

// Proteksi header HTTP (XSS, Clickjacking, MIME Sniffing, dll.)
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS: Hanya izinkan origin yang terdaftar (bukan wildcard *)
const appPort = process.env.PORT || 5000;
const allowedOrigins = (process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000', 'http://localhost:5173'])
  .concat([`http://localhost:${appPort}`, `http://127.0.0.1:${appPort}`]);

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

// Swagger Documentation Route (Dengan CSP khusus agar Swagger UI dimuat dengan aman)
app.use('/api-docs', (req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: validator.swagger.io; connect-src 'self';"
  );
  next();
}, swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Auth Routes
app.use('/api/auth', authRoutes);

// Service Routes
app.use('/api/travel', travelRoutes);
app.use('/api/charter', charterRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/content', contentRoutes);

// Admin Routes
app.use('/api/admin/cashflow', cashflowRoutes);
app.use('/api/admin/master', masterDataRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/admin/assignments', assignmentRoutes);
app.use('/api/admin/cms', cmsRoutes);

// Driver Routes
app.use('/api/driver', driverRoutes);

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
