const express = require('express');
const router = express.Router();
const mechanicController = require('../controllers/mechanic.controller');
const { validate, mechanicValidationSchemas } = require('../middlewares/validation.middleware');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Keamanan: Hanya user dengan role 'mechanic' atau 'super_admin' yang dapat mengakses
router.use(authenticate, authorize('mechanic', 'super_admin'));

// 1. Get daftar semua armada dan statusnya
router.get('/fleets', mechanicController.getFleets);

// 2. Update status keaktifan armada (active / maintenance)
router.put('/fleets/:id/status', validate(mechanicValidationSchemas.fleetStatus), mechanicController.updateFleetStatus);

// 3. Get daftar log histori perawatan kendaraan
router.get('/maintenance-logs', mechanicController.getMainMaintenanceLogs || mechanicController.getMaintenanceLogs);

// 4. Tambahkan catatan log histori perawatan baru
router.post('/maintenance-logs', validate(mechanicValidationSchemas.maintenanceLog), mechanicController.createMaintenanceLog);

module.exports = router;
