const express = require('express');
const router = express.Router();
const travelController = require('../controllers/travel.controller');
const { validate, travelBookingSchema } = require('../middlewares/validation.middleware');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Public: Melihat jadwal
router.get('/schedules', travelController.getSchedules);

// Customer: Membuat pemesanan (terkunci 10 menit)
router.post('/bookings', authenticate, authorize('customer'), validate(travelBookingSchema), travelController.createBooking);

// Driver & Super Admin: Melihat manifest penumpang (paid & prepaid)
router.get('/manifest/:schedule_id', authenticate, authorize('driver', 'super_admin'), travelController.getDriverManifest);

// Customer: Melihat riwayat pemesanan
router.get('/history', authenticate, authorize('customer'), travelController.getTravelHistory);

module.exports = router;
