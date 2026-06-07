const express = require('express');
const router = express.Router();
const masterController = require('../controllers/masterData.controller');
const { validate, adminValidationSchemas } = require('../middlewares/validation.middleware');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Gunakan middleware keamanan di semua rute ini (Hanya Super Admin)
router.use(authenticate, authorize('super_admin'));

// Helper untuk generate rute CRUD
const crudRoute = (path, table, schema) => {
  router.get(path, masterController.getRecords(table));
  if (schema) {
    router.post(path, validate(schema), masterController.createRecord(table));
    router.put(`${path}/:id`, validate(schema), masterController.updateRecord(table));
  } else {
    router.post(path, masterController.createRecord(table));
    router.put(`${path}/:id`, masterController.updateRecord(table));
  }
  router.delete(`${path}/:id`, masterController.deleteRecord(table));
};

// Definisi Rute Master Data
crudRoute('/fleets', 'fleets', adminValidationSchemas.fleet);
crudRoute('/routes', 'routes', adminValidationSchemas.route);
crudRoute('/schedules', 'schedules', adminValidationSchemas.schedule);
crudRoute('/users', 'users', adminValidationSchemas.user);
crudRoute('/banners', 'banners', adminValidationSchemas.banner);
crudRoute('/destinations', 'destinations', adminValidationSchemas.destination);

// Fitur Spesifik: Assign Schedule (Menugaskan Driver & Mobil)
router.put('/schedules/:id/assign', masterController.assignSchedule);

// Fitur Spesifik: Verifikasi Tiket Travel Reguler
router.get('/travel-bookings', masterController.getTravelBookings);
router.put('/travel-bookings/:id/verify', masterController.verifyTravelBooking);

module.exports = router;
