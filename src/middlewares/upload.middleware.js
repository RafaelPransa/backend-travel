const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Definisikan direktori-direktori upload
const paymentsDir = path.join(__dirname, '../../public/uploads/payments');
const expensesDir = path.join(__dirname, '../../public/uploads/expenses');
const maintenanceDir = path.join(__dirname, '../../public/uploads/maintenance');
const packagesDir = path.join(__dirname, '../../public/uploads/packages');

// Buat direktori otomatis jika belum ada
[paymentsDir, expensesDir, maintenanceDir, packagesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Helper untuk membuat konfigurasi storage disk multer
const createStorage = (destDir, prefix) => {
  return multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, destDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      cb(null, prefix + '-' + uniqueSuffix + ext);
    }
  });
};

// Filter file: Hanya gambar (JPG, JPEG, PNG)
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
    cb(null, true);
  } else {
    cb(new Error('Format file tidak didukung. Hanya menerima JPG, JPEG, atau PNG.'), false);
  }
};

// Batasan ukuran file (5MB)
const limits = {
  fileSize: 5 * 1024 * 1024 // 5 MB
};

// Ekspor middleware multer spesifik
const uploadPayment = multer({
  storage: createStorage(paymentsDir, 'payment'),
  fileFilter,
  limits
});

const uploadExpense = multer({
  storage: createStorage(expensesDir, 'expense'),
  fileFilter,
  limits
});

const uploadMaintenance = multer({
  storage: createStorage(maintenanceDir, 'maintenance'),
  fileFilter,
  limits
});

const uploadPackage = multer({
  storage: createStorage(packagesDir, 'package'),
  fileFilter,
  limits
});

module.exports = {
  uploadPayment,
  uploadExpense,
  uploadMaintenance,
  uploadPackage
};
