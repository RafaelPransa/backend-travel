const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driver.controller');
const { validate, driverValidationSchemas } = require('../middlewares/validation.middleware');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Gunakan middleware keamanan di semua rute ini (Hanya Driver)
router.use(authenticate, authorize('driver'));

// Driver: Melihat daftar tugas/jadwal jalan (Mobil, Rute, & Manifest)
router.get('/schedules', driverController.getMySchedules);

// Driver: Mengubah status perjalanan ('scheduled', 'board', 'driving', 'completed', 'cancelled')
router.put('/schedules/:id/status', validate(driverValidationSchemas.scheduleStatus), driverController.updateScheduleStatus);

module.exports = router;
