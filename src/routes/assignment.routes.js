const express = require("express");
const router = express.Router();
const assignmentController = require("../controllers/assignment.controller");
const { authenticate, authorize } = require("../middlewares/auth.middleware");

/**
 * @openapi
 * /api/admin/assignments:
 *   get:
 *     summary: Mendapatkan Semua Penugasan Supir & Armada (Super Admin Only)
 *     description: Mengambil seluruh data jadwal perjalanan reguler (RUTE) dan pesanan pariwisata (CHARTER) beserta status penugasan supir dan armadanya.
 *     tags:
 *       - Admin Assignments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: phase
 *         schema:
 *           type: string
 *           enum: [pending, active, completed]
 *           default: pending
 *         description: Fase penugasan (pending = supir belum ditunjuk, active = dalam perjalanan/penjemputan, completed = selesai)
 *     responses:
 *       200:
 *         description: Berhasil mengambil data penugasan
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
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         example: 123e4567-e89b-12d3-a456-426614174000
 *                       type:
 *                         type: string
 *                         enum: [RUTE, CHARTER]
 *                         example: RUTE
 *                       title:
 *                         type: string
 *                         example: "Travel Reguler: Jakarta ➔ Bandung"
 *                       departure_date:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-06-26T12:00:00.000Z"
 *                       return_date:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-06-28T12:00:00.000Z"
 *                       fleet_id:
 *                         type: string
 *                         format: uuid
 *                         nullable: true
 *                         example: 123e4567-e89b-12d3-a456-426614174001
 *                       fleet_car_type:
 *                         type: string
 *                         nullable: true
 *                         example: Luxio
 *                       fleet_plate_number:
 *                         type: string
 *                         nullable: true
 *                         example: "B 1234 CD"
 *                       fleet_capacity:
 *                         type: integer
 *                         nullable: true
 *                         example: 8
 *                       total_passengers:
 *                         type: integer
 *                         example: 5
 *                       total_packages:
 *                         type: integer
 *                         example: 2
 *                       total_revenue:
 *                         type: number
 *                         example: 750000
 *                       customer_name:
 *                         type: string
 *                         example: Rafael
 *       401:
 *         description: Token JWT tidak valid atau kosong
 *       403:
 *         description: Akses ditolak (Hanya Super Admin)
 *       500:
 *         description: Terjadi kesalahan pada server
 */
router.get("/", authenticate, authorize("super_admin"), assignmentController.getAssignments);

/**
 * @openapi
 * /api/admin/assignments/available-fleets:
 *   get:
 *     summary: Mendapatkan Armada yang Tersedia untuk Pengganti (Super Admin Only)
 *     description: Mengambil daftar armada yang tidak memiliki jadwal/tugas aktif pada rentang tanggal tertentu.
 *     tags:
 *       - Admin Assignments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: start_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Tanggal mulai pencarian armada tersedia (YYYY-MM-DD)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Tanggal akhir pencarian armada tersedia (YYYY-MM-DD). Jika kosong, menggunakan start_date.
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar armada yang tersedia
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
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                         example: 123e4567-e89b-12d3-a456-426614174001
 *                       plate_number:
 *                         type: string
 *                         example: "B 1234 CD"
 *                       car_type:
 *                         type: string
 *                         example: Luxio
 *                       seat_capacity:
 *                         type: integer
 *                         example: 8
 *                       status:
 *                         type: string
 *                         example: active
 *       400:
 *         description: Input tidak valid (e.g. start_date kosong)
 *       401:
 *         description: Token JWT tidak valid atau kosong
 *       403:
 *         description: Akses ditolak (Hanya Super Admin)
 *       500:
 *         description: Gagal mengambil armada pengganti
 */
router.get("/available-fleets", authenticate, authorize("super_admin"), assignmentController.getAvailableReplacementFleets);

/**
 * @openapi
 * /api/admin/assignments/{type}/{id}/assign:
 *   put:
 *     summary: Menugaskan Supir ke Perjalanan (Super Admin Only)
 *     description: Menunjuk supir utama, supir cadangan, armada, dan waktu penjemputan untuk perjalanan reguler (RUTE) atau pesanan pariwisata (CHARTER).
 *     tags:
 *       - Admin Assignments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [RUTE, CHARTER]
 *         description: Tipe penugasan (RUTE atau CHARTER)
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID Schedule (jika type=RUTE) atau ID Charter Booking (jika type=CHARTER)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - driver_id
 *             properties:
 *               driver_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID Supir Utama
 *                 example: 123e4567-e89b-12d3-a456-426614174005
 *               driver_2_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: ID Supir Cadangan
 *                 example: 123e4567-e89b-12d3-a456-426614174006
 *               fleet_id:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *                 description: ID Armada Kendaraan
 *                 example: 123e4567-e89b-12d3-a456-426614174001
 *               pickup_time:
 *                 type: string
 *                 description: Estimasi waktu penjemputan (ETA) penumpang (Khusus type RUTE)
 *                 example: "08:00"
 *     responses:
 *       200:
 *         description: Penugasan berhasil disimpan
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
 *                   example: Penugasan berhasil disimpan
 *       400:
 *         description: Input tidak valid (e.g. driver_id kosong, tipe tidak valid)
 *       401:
 *         description: Token JWT tidak valid atau kosong
 *       403:
 *         description: Akses ditolak (Hanya Super Admin)
 *       500:
 *         description: Terjadi kesalahan pada server
 */
router.put("/:type/:id/assign", authenticate, authorize("super_admin"), assignmentController.assignDriver);

/**
 * @openapi
 * /api/admin/assignments/{type}/{id}/change-fleet:
 *   put:
 *     summary: Mengganti Armada Perjalanan (Super Admin Only)
 *     description: Mengubah armada kendaraan yang ditugaskan untuk perjalanan (RUTE) atau pesanan pariwisata (CHARTER).
 *     tags:
 *       - Admin Assignments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [RUTE, CHARTER]
 *         description: Tipe penugasan (RUTE atau CHARTER)
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID Schedule (jika type=RUTE) atau ID Charter Booking (jika type=CHARTER)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fleet_id
 *             properties:
 *               fleet_id:
 *                 type: string
 *                 format: uuid
 *                 description: ID Armada Kendaraan Baru
 *                 example: 123e4567-e89b-12d3-a456-426614174001
 *     responses:
 *       200:
 *         description: Armada berhasil diganti
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
 *                   example: Armada berhasil diganti
 *       400:
 *         description: Input tidak valid (e.g. fleet_id kosong)
 *       401:
 *         description: Token JWT tidak valid atau kosong
 *       403:
 *         description: Akses ditolak (Hanya Super Admin)
 *       500:
 *         description: Gagal mengganti armada
 */
router.put("/:type/:id/change-fleet", authenticate, authorize("super_admin"), assignmentController.changeFleet);

/**
 * @openapi
 * /api/admin/assignments/{type}/{id}/reject:
 *   put:
 *     summary: Membatalkan/Menolak Penugasan & Pesanan (Super Admin Only)
 *     description: Membatalkan jadwal perjalanan reguler (RUTE) atau pesanan pariwisata (CHARTER) beserta penugasannya. Status akan berubah menjadi dibatalkan.
 *     tags:
 *       - Admin Assignments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         required: true
 *         schema:
 *           type: string
 *           enum: [RUTE, CHARTER]
 *         description: Tipe penugasan (RUTE atau CHARTER)
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID Schedule (jika type=RUTE) atau ID Charter Booking (jika type=CHARTER)
 *     responses:
 *       200:
 *         description: Penugasan dan pesanan berhasil dibatalkan
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
 *                   example: Penugasan dan pesanan berhasil dibatalkan
 *       401:
 *         description: Token JWT tidak valid atau kosong
 *       403:
 *         description: Akses ditolak (Hanya Super Admin)
 *       500:
 *         description: Gagal membatalkan penugasan
 */
router.put("/:type/:id/reject", authenticate, authorize("super_admin"), assignmentController.rejectAssignment);

// PUT /api/admin/assignments/:type/:id/unassign
router.put("/:type/:id/unassign", authenticate, authorize("super_admin"), assignmentController.unassignDriver);

module.exports = router;
