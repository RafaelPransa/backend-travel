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
 *     description: Memperbarui data pengguna. Perubahan hanya diizinkan untuk akun dengan peran 'customer' atau 'driver'. Perubahan pada akun 'super_admin' akan ditolak.
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
 *       403:
 *         description: Perubahan pada akun Super Admin tidak diizinkan
 *   delete:
 *     summary: Menghapus Data Pengguna (Super Admin)
 *     description: Menghapus data pengguna. Penghapusan hanya diizinkan untuk akun dengan peran 'customer' atau 'driver'. Penghapusan pada akun 'super_admin' akan ditolak.
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
 *       403:
 *         description: Penghapusan akun Super Admin tidak diizinkan
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
 * /api/admin/master/promotions:
 *   get:
 *     summary: Mendapatkan Semua Data Promosi (Super Admin)
 *     description: Mengambil seluruh data promosi (beranda, layanan, all) untuk kebutuhan master data admin.
 *     tags:
 *       - Admin Master Promotions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data promosi
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *   post:
 *     summary: Menambah Konten Promosi Baru (Super Admin)
 *     description: Membuat promosi baru dengan menyertakan tagline, deskripsi, diskon, badge, status aktif, dan jenis promosi.
 *     tags:
 *       - Admin Master Promotions
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminPromotionSchema'
 *     responses:
 *       201:
 *         description: Konten promosi berhasil dibuat
 * 
 * /api/admin/master/promotions/{id}:
 *   put:
 *     summary: Memperbarui Data Promosi (Super Admin)
 *     description: Memperbarui rincian konten promosi berdasarkan ID.
 *     tags:
 *       - Admin Master Promotions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Promotion ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminPromotionSchema'
 *     responses:
 *       200:
 *         description: Promosi berhasil diperbarui
 *   delete:
 *     summary: Menghapus Data Promosi (Super Admin)
 *     description: Menghapus data promosi dari database berdasarkan ID.
 *     tags:
 *       - Admin Master Promotions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Promotion ID
 *     responses:
 *       200:
 *         description: Promosi berhasil dihapus
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

// Helper CRUD generik (di-import dari modul bersama)
const crudRouteHelper = require('../helpers/crudRoute');
const crudRoute = (path, table, schema) => crudRouteHelper(router, path, table, schema);

// Definisi Rute Master Data
crudRoute('/fleets', 'fleets', adminValidationSchemas.fleet);
crudRoute('/routes', 'routes', adminValidationSchemas.route);
crudRoute('/schedules', 'schedules', adminValidationSchemas.schedule);
router.put('/users/:id', validate(adminValidationSchemas.userUpdate), masterController.updateUser);
router.delete('/users/:id', masterController.deleteUser);
crudRoute('/users', 'users', adminValidationSchemas.user);
crudRoute('/banners', 'banners', adminValidationSchemas.banner);
crudRoute('/destinations', 'destinations', adminValidationSchemas.destination);
crudRoute('/promotions', 'promotions', adminValidationSchemas.promotion);
router.get('/package-shipments', masterController.getPackageShipments);
crudRoute('/package-shipments', 'package_shipments', adminValidationSchemas.packageShipment);
crudRoute('/institutional-expenses', 'institutional_expenses', adminValidationSchemas.institutionalExpense);
crudRoute('/charter-bookings', 'charter_bookings');

/**
 * @openapi
 * /api/admin/master/institutional-expenses:
 *   get:
 *     summary: Mendapatkan Semua Data Pengeluaran Instansi (Super Admin)
 *     tags:
 *       - Admin Master Institutional Expenses
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data pengeluaran instansi
 *   post:
 *     summary: Menambah Pengeluaran Instansi Baru (Super Admin)
 *     tags:
 *       - Admin Master Institutional Expenses
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminInstitutionalExpenseSchema'
 *     responses:
 *       201:
 *         description: Pengeluaran instansi berhasil dibuat
 * 
 * /api/admin/master/institutional-expenses/{id}:
 *   put:
 *     summary: Memperbarui Data Pengeluaran Instansi (Super Admin)
 *     tags:
 *       - Admin Master Institutional Expenses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Institutional Expense ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminInstitutionalExpenseSchema'
 *     responses:
 *       200:
 *         description: Pengeluaran instansi berhasil diperbarui
 *   delete:
 *     summary: Menghapus Data Pengeluaran Instansi (Super Admin)
 *     tags:
 *       - Admin Master Institutional Expenses
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Institutional Expense ID
 *     responses:
 *       200:
 *         description: Pengeluaran instansi berhasil dihapus
 */

// Fitur Spesifik: Assign Schedule (Menugaskan Driver & Mobil)

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

// Fitur Spesifik: Assign Schedule (Menugaskan Driver & Mobil)
router.put('/schedules/:id/assign', masterController.assignSchedule);

/**
 * @openapi
 * /api/admin/master/schedules/{id}/depart:
 *   put:
 *     summary: Berangkatkan Jadwal Perjalanan (Super Admin)
 *     description: Mengubah status jadwal perjalanan secara paksa menjadi 'departed' dan status seluruh tiket penumpang/paket di dalamnya menjadi 'dalam_penjemputan'.
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
 *           format: uuid
 *         description: Schedule ID (UUID)
 *     responses:
 *       200:
 *         description: Jadwal perjalanan berhasil diberangkatkan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Perjalanan berhasil diberangkatkan
 */
router.put('/schedules/:id/depart', masterController.departSchedule);

// Fitur Spesifik: Verifikasi & Kelola Tiket Travel Reguler
router.get('/travel-bookings', masterController.getTravelBookings);
router.put('/travel-bookings/:id/verify', masterController.verifyTravelBooking);
router.put('/travel-bookings/:id/status', masterController.updateTravelBookingStatus);

/**
 * @openapi
 * /api/admin/master/travel-bookings/{id}:
 *   delete:
 *     summary: Hapus Pemesanan Tiket Travel (Super Admin)
 *     description: Menghapus secara permanen record pemesanan tiket travel dari database.
 *     tags:
 *       - Admin Master Travel Bookings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Booking ID (UUID)
 *     responses:
 *       200:
 *         description: Pemesanan tiket travel berhasil dihapus
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Pesanan tiket travel berhasil dihapus
 */
router.delete('/travel-bookings/:id', masterController.deleteTravelBooking);

module.exports = router;
