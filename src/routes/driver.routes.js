const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driver.controller');
const { validate, driverValidationSchemas, adminValidationSchemas } = require('../middlewares/validation.middleware');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { uploadExpense, uploadMaintenance, uploadPayment } = require('../middlewares/upload.middleware');

// ============================================================
// RUTE KHUSUS DRIVER (Hanya role 'driver')
// ============================================================

/**
 * @openapi
 * /api/driver/schedules:
 *   get:
 *     summary: Mendapatkan Tugas Perjalanan Driver (Driver Only)
 *     description: Driver melihat semua jadwal perjalanan yang ditugaskan beserta daftar manifest penumpang.
 *     tags:
 *       - Driver Area
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar tugas driver
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
 *                   example: Berhasil mengambil daftar tugas supir
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 */
router.get('/schedules', authenticate, authorize('driver'), driverController.getMySchedules);

/**
 * @openapi
 * /api/driver/schedules/{id}/status:
 *   put:
 *     summary: Memperbarui Status Perjalanan Driver (Driver Only)
 *     description: Driver memperbarui status keberangkatan/perjalanan (scheduled, board, driving, completed, cancelled).
 *     tags:
 *       - Driver Area
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [scheduled, board, driving, completed, cancelled]
 *     responses:
 *       200:
 *         description: Status perjalanan berhasil diperbarui
 */
router.put('/schedules/:id/status', authenticate, authorize('driver'), validate(driverValidationSchemas.scheduleStatus), driverController.updateScheduleStatus);

/**
 * @openapi
 * /api/driver/schedules/bookings/{id}/status:
 *   put:
 *     summary: Memperbarui Status Penumpang (Driver Only)
 *     description: Driver memperbarui status penumpang (dalam_penjemputan, dalam_perjalanan, selesai).
 *     tags:
 *       - Driver Area
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
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status penumpang berhasil diperbarui
 */
router.put('/schedules/bookings/:id/status', authenticate, authorize('driver'), uploadPayment.single('payment_proof'), driverController.updateTravelBookingStatus);

/**
 * @openapi
 * /api/driver/schedules/packages/{id}/status:
 *   put:
 *     summary: Memperbarui Status Paket (Driver Only)
 *     description: Driver memperbarui status paket (menunggu_penjemputan, on_transit, delivered).
 *     tags:
 *       - Driver Area
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Package ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status paket berhasil diperbarui
 */
router.put('/schedules/packages/:id/status', authenticate, authorize('driver'), uploadPayment.single('payment_proof'), driverController.updatePackageStatus);

/**
 * @openapi
 * /api/driver/schedules/charters/{id}/status:
 *   put:
 *     summary: Memperbarui Status Charter (Driver Only)
 *     description: Driver memperbarui status charter (menunggu_penjemputan, dalam_penjemputan, on_going, selesai).
 *     tags:
 *       - Driver Area
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Charter ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Status charter berhasil diperbarui
 */
router.put('/schedules/charters/:id/status', authenticate, authorize('driver'), uploadPayment.single('payment_proof'), driverController.updateCharterStatus);


/**
 * @openapi
 * /api/driver/expenses:
 *   post:
 *     summary: Mengunggah Pengeluaran Operasional (Driver Only)
 *     description: Driver mengunggah bukti pengeluaran di jalan (bensin, tol, parkir, dll.) berupa formulir beserta struk fisik.
 *     tags:
 *       - Driver Area
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - schedule_id
 *               - amount
 *               - category
 *               - proof_image
 *             properties:
 *               schedule_id:
 *                 type: string
 *                 format: uuid
 *               amount:
 *                 type: number
 *                 example: 150000
 *               category:
 *                 type: string
 *                 enum: [fuel, toll, parking, other]
 *               description:
 *                 type: string
 *                 example: Bensin Luxio rute Jkt-Pnw
 *               proof_image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Biaya operasional berhasil diajukan
 *   get:
 *     summary: Histori Pengeluaran Operasional Driver (Driver Only)
 *     description: Mengambil seluruh riwayat pengeluaran operasional yang diajukan oleh driver aktif.
 *     tags:
 *       - Driver Area
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data pengeluaran
 */
router.post('/expenses', authenticate, authorize('driver'), uploadExpense.single('proof_image'), validate(driverValidationSchemas.operationalExpense), driverController.createExpense);
router.get('/expenses', authenticate, authorize('driver'), driverController.getMyExpenses);

// ============================================================
// RUTE MIGRASI PERAWATAN & ARMADA (Driver & Super Admin)
// ============================================================

/**
 * @openapi
 * /api/driver/fleets:
 *   get:
 *     summary: Mendapatkan Semua Armada & Statusnya (Driver & Admin)
 *     description: Mengambil daftar seluruh unit mobil beserta status terkininya (active/maintenance).
 *     tags:
 *       - Fleet & Maintenance Area
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data armada
 * 
 * /api/driver/fleets/{id}/status:
 *   put:
 *     summary: Memperbarui Status Armada (Driver & Admin)
 *     description: Mengubah status unit mobil menjadi aktif ('active') atau perbaikan ('maintenance').
 *     tags:
 *       - Fleet & Maintenance Area
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Fleet ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, maintenance]
 *     responses:
 *       200:
 *         description: Status armada berhasil diperbarui
 */
router.get('/fleets', authenticate, authorize('driver', 'super_admin'), driverController.getFleets);
router.put('/fleets/:id/status', authenticate, authorize('driver', 'super_admin'), validate(driverValidationSchemas.fleetStatus), driverController.updateFleetStatus);

/**
 * @openapi
 * /api/driver/maintenance-logs:
 *   get:
 *     summary: Mendapatkan Histori Log Perawatan (Driver & Admin)
 *     description: Mengambil daftar histori perawatan/servis semua armada.
 *     tags:
 *       - Fleet & Maintenance Area
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil log perawatan
 *   post:
 *     summary: Menambahkan Log Perawatan Baru (Driver & Admin)
 *     description: Driver/Admin mencatat histori perbaikan mobil baru beserta foto bukti nota/struk servis.
 *     tags:
 *       - Fleet & Maintenance Area
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - fleet_id
 *               - service_date
 *               - description
 *               - cost
 *             properties:
 *               fleet_id:
 *                 type: string
 *                 format: uuid
 *               service_date:
 *                 type: string
 *                 format: date
 *                 example: 2026-06-12
 *               description:
 *                 type: string
 *                 example: Ganti oli mesin & filter oli
 *               cost:
 *                 type: number
 *                 example: 350000
 *               proof_image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Catatan perawatan berhasil dibuat
 */
router.get('/maintenance-logs', authenticate, authorize('driver', 'super_admin'), driverController.getMaintenanceLogs);
router.post('/maintenance-logs', authenticate, authorize('driver', 'super_admin'), uploadMaintenance.single('proof_image'), validate(driverValidationSchemas.maintenanceLog), driverController.createMaintenanceLog);

/**
 * @openapi
 * /api/driver/maintenance-logs/{id}/verify:
 *   put:
 *     summary: Verifikasi Log Perawatan Kendaraan (Super Admin Only)
 *     description: Mengubah status log perawatan/servis armada menjadi disetujui (approved) atau ditolak (rejected). Jika disetujui, trigger otomatis mencatat pengeluaran.
 *     tags:
 *       - Fleet & Maintenance Area
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Maintenance Log ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *                 description: Status persetujuan
 *     responses:
 *       200:
 *         description: Status persetujuan log perawatan berhasil diperbarui
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
 *                   example: Laporan perbaikan kendaraan berhasil disetujui
 *                 data:
 *                   type: object
 *       400:
 *         description: Input tidak valid
 *       401:
 *         description: Token JWT tidak valid atau kosong
 *       403:
 *         description: Hanya Super Admin yang diizinkan memverifikasi
 *       404:
 *         description: Laporan perbaikan tidak ditemukan
 *       500:
 *         description: Gagal memproses persetujuan log perawatan
 */
router.put('/maintenance-logs/:id/verify', authenticate, authorize('super_admin'), validate(adminValidationSchemas.approveExpense), driverController.verifyMaintenanceLog);

module.exports = router;
