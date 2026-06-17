const express = require('express');
const router = express.Router();
const masterController = require('../controllers/masterData.controller');
const { validate, adminValidationSchemas } = require('../middlewares/validation.middleware');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Gunakan middleware keamanan di semua rute ini (Hanya Super Admin)
router.use(authenticate, authorize('super_admin'));

/**
 * @openapi
 * /api/admin/master/fleets:
 *   get:
 *     summary: Mendapatkan Semua Data Armada (Super Admin)
 *     tags:
 *       - Admin Master Fleets
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data armada
 *   post:
 *     summary: Menambah Armada Baru (Super Admin)
 *     tags:
 *       - Admin Master Fleets
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminFleetSchema'
 *     responses:
 *       201:
 *         description: Armada berhasil dibuat
 * 
 * /api/admin/master/fleets/{id}:
 *   put:
 *     summary: Memperbarui Data Armada (Super Admin)
 *     tags:
 *       - Admin Master Fleets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Fleet ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminFleetSchema'
 *     responses:
 *       200:
 *         description: Armada berhasil diperbarui
 *   delete:
 *     summary: Menghapus Data Armada (Super Admin)
 *     tags:
 *       - Admin Master Fleets
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Fleet ID
 *     responses:
 *       200:
 *         description: Armada berhasil dihapus
 */

/**
 * @openapi
 * /api/admin/master/routes:
 *   get:
 *     summary: Mendapatkan Semua Rute Trayek (Super Admin)
 *     tags:
 *       - Admin Master Routes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data rute
 *   post:
 *     summary: Menambah Rute Trayek Baru (Super Admin)
 *     tags:
 *       - Admin Master Routes
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminRouteSchema'
 *     responses:
 *       201:
 *         description: Rute berhasil dibuat
 * 
 * /api/admin/master/routes/{id}:
 *   put:
 *     summary: Memperbarui Data Rute Trayek (Super Admin)
 *     tags:
 *       - Admin Master Routes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Route ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminRouteSchema'
 *     responses:
 *       200:
 *         description: Rute berhasil diperbarui
 *   delete:
 *     summary: Menghapus Data Rute Trayek (Super Admin)
 *     tags:
 *       - Admin Master Routes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Route ID
 *     responses:
 *       200:
 *         description: Rute berhasil dihapus
 */

/**
 * @openapi
 * /api/admin/master/schedules:
 *   get:
 *     summary: Mendapatkan Semua Jadwal Travel (Super Admin)
 *     tags:
 *       - Admin Master Schedules
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data jadwal
 *   post:
 *     summary: Menambah Jadwal Travel Baru (Super Admin)
 *     tags:
 *       - Admin Master Schedules
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminScheduleSchema'
 *     responses:
 *       201:
 *         description: Jadwal berhasil dibuat
 * 
 * /api/admin/master/schedules/{id}:
 *   put:
 *     summary: Memperbarui Data Jadwal Travel (Super Admin)
 *     tags:
 *       - Admin Master Schedules
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Schedule ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminScheduleSchema'
 *     responses:
 *       200:
 *         description: Jadwal berhasil diperbarui
 *   delete:
 *     summary: Menghapus Data Jadwal Travel (Super Admin)
 *     tags:
 *       - Admin Master Schedules
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Schedule ID
 *     responses:
 *       200:
 *         description: Jadwal berhasil dihapus
 */

/**
 * @openapi
 * /api/admin/master/users:
 *   get:
 *     summary: Mendapatkan Semua Data Pengguna (Super Admin)
 *     tags:
 *       - Admin Master Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data pengguna
 *   post:
 *     summary: Menambah Pengguna Baru (Super Admin)
 *     tags:
 *       - Admin Master Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminUserSchema'
 *     responses:
 *       201:
 *         description: Pengguna berhasil dibuat
 * 
 * /api/admin/master/users/{id}:
 *   put:
 *     summary: Memperbarui Data Pengguna (Super Admin)
 *     tags:
 *       - Admin Master Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminUserSchema'
 *     responses:
 *       200:
 *         description: Pengguna berhasil diperbarui
 *   delete:
 *     summary: Menghapus Data Pengguna (Super Admin)
 *     tags:
 *       - Admin Master Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: Pengguna berhasil dihapus
 */

/**
 * @openapi
 * /api/admin/master/banners:
 *   get:
 *     summary: Mendapatkan Semua Data Banner Promosi (Super Admin)
 *     tags:
 *       - Admin Master Banners
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data banner
 *   post:
 *     summary: Menambah Banner Promosi Baru (Super Admin)
 *     tags:
 *       - Admin Master Banners
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminBannerSchema'
 *     responses:
 *       201:
 *         description: Banner berhasil dibuat
 * 
 * /api/admin/master/banners/{id}:
 *   put:
 *     summary: Memperbarui Data Banner Promosi (Super Admin)
 *     tags:
 *       - Admin Master Banners
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Banner ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminBannerSchema'
 *     responses:
 *       200:
 *         description: Banner berhasil diperbarui
 *   delete:
 *     summary: Menghapus Data Banner Promosi (Super Admin)
 *     tags:
 *       - Admin Master Banners
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Banner ID
 *     responses:
 *       200:
 *         description: Banner berhasil dihapus
 */

/**
 * @openapi
 * /api/admin/master/destinations:
 *   get:
 *     summary: Mendapatkan Semua Rekomendasi Destinasi (Super Admin)
 *     tags:
 *       - Admin Master Destinasi Wisata
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data destinasi
 *   post:
 *     summary: Menambah Rekomendasi Destinasi Baru (Super Admin)
 *     tags:
 *       - Admin Master Destinasi Wisata
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminDestinationSchema'
 *     responses:
 *       201:
 *         description: Destinasi berhasil dibuat
 * 
 * /api/admin/master/destinations/{id}:
 *   put:
 *     summary: Memperbarui Data Destinasi (Super Admin)
 *     tags:
 *       - Admin Master Destinasi Wisata
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Destination ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminDestinationSchema'
 *     responses:
 *       200:
 *         description: Destinasi berhasil diperbarui
 *   delete:
 *     summary: Menghapus Data Destinasi (Super Admin)
 *     tags:
 *       - Admin Master Destinasi Wisata
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Destination ID
 *     responses:
 *       200:
 *         description: Destinasi berhasil dihapus
 */

/**
 * @openapi
 * /api/admin/master/package-shipments:
 *   get:
 *     summary: Mendapatkan Semua Data Pengiriman Paket (Super Admin)
 *     tags:
 *       - Admin Master Package Shipments
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data pengiriman paket
 *   post:
 *     summary: Menambah Pengiriman Paket Baru (Super Admin)
 *     tags:
 *       - Admin Master Package Shipments
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PackageShipmentSchema'
 *     responses:
 *       201:
 *         description: Pengiriman paket berhasil dibuat
 * 
 * /api/admin/master/package-shipments/{id}:
 *   put:
 *     summary: Memperbarui Data Pengiriman Paket (Super Admin)
 *     tags:
 *       - Admin Master Package Shipments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Package Shipment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PackageShipmentSchema'
 *     responses:
 *       200:
 *         description: Pengiriman paket berhasil diperbarui
 *   delete:
 *     summary: Menghapus Data Pengiriman Paket (Super Admin)
 *     tags:
 *       - Admin Master Package Shipments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Package Shipment ID
 *     responses:
 *       200:
 *         description: Pengiriman paket berhasil dihapus
 */

/**
 * @openapi
 * /api/admin/master/schedules/{id}/assign:
 *   put:
 *     summary: Menugaskan Driver & Unit Armada ke Jadwal (Super Admin)
 *     tags:
 *       - Admin Operational Area
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Schedule ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fleet_id
 *               - driver_id
 *             properties:
 *               fleet_id:
 *                 type: string
 *                 format: uuid
 *               driver_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Driver dan armada berhasil ditugaskan ke jadwal
 */

/**
 * @openapi
 * /api/admin/master/travel-bookings:
 *   get:
 *     summary: Mendapatkan Semua Antrean Booking Tiket Travel (Super Admin)
 *     tags:
 *       - Admin Operational Area
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data tiket booking travel
 * 
 * /api/admin/master/travel-bookings/{id}/verify:
 *   put:
 *     summary: Verifikasi Pembayaran Tiket Travel (Super Admin)
 *     tags:
 *       - Admin Operational Area
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Tiket travel berhasil diverifikasi (lunas)
 * 
 * /api/admin/master/travel-bookings/{id}/status:
 *   put:
 *     summary: Persetujuan, Penolakan, dan Update Data Tiket Travel (Super Admin)
 *     tags:
 *       - Admin Operational Area
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               booking_status:
 *                 type: string
 *                 enum: [menunggu_konfirmasi, menunggu_pembayaran, selesai, dibatalkan, ditolak]
 *               eta:
 *                 type: string
 *                 example: "08:30"
 *               price:
 *                 type: number
 *                 example: 200000
 *     responses:
 *       200:
 *         description: Tiket travel berhasil diperbarui
 */

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
crudRoute('/promotions', 'promotions', adminValidationSchemas.promotion);
crudRoute('/package-shipments', 'package_shipments', adminValidationSchemas.packageShipment);

// Fitur Spesifik: Assign Schedule (Menugaskan Driver & Mobil)
router.put('/schedules/:id/assign', masterController.assignSchedule);

// Fitur Spesifik: Verifikasi & Kelola Tiket Travel Reguler
router.get('/travel-bookings', masterController.getTravelBookings);
router.put('/travel-bookings/:id/verify', masterController.verifyTravelBooking);
router.put('/travel-bookings/:id/status', masterController.updateTravelBookingStatus);

module.exports = router;
