const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Pastikan direktori tujuan sudah ada, jika tidak buat otomatis
const uploadDir = path.join(__dirname, '../../public/uploads/payments');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Konfigurasi Multer Storage Local
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Format nama file: payment-<timestamp>.<ext>
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'payment-' + uniqueSuffix + ext);
  }
});

// Filter untuk hanya menerima file gambar
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg') {
    cb(null, true);
  } else {
    cb(new Error('Format file tidak didukung. Hanya menerima JPG, JPEG, atau PNG.'), false);
  }
};

// Batasan ukuran file (5MB)
const uploadPayment = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5 MB
  }
});

module.exports = {
  uploadPayment
};
