const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Seluruh rute dashboard hanya bisa diakses oleh Super Admin
router.use(authenticate, authorize('super_admin'));

/**
 * @openapi
 * /api/admin/dashboard/metrics:
 *   get:
 *     summary: Rangkuman Metrik Dasbor Utama (Super Admin)
 *     description: Mengambil seluruh metrik esensial untuk dasbor utama admin meliputi pendapatan hari ini, jumlah pengguna, jumlah supir, volume pesanan (hari ini/bulan ini), dan kontribusi pendapatan per unit armada.
 *     tags:
 *       - Admin Dashboard Area
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data metrik dasbor utama
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
 *                   example: Berhasil mengambil metrik dasbor utama
 *                 data:
 *                   type: object
 *                   properties:
 *                     today_revenue:
 *                       type: number
 *                       example: 1250000
 *                     registered_users:
 *                       type: integer
 *                       example: 15
 *                     active_drivers:
 *                       type: integer
 *                       example: 4
 *                     orders_today:
 *                       type: integer
 *                       example: 3
 *                     orders_this_month:
 *                       type: integer
 *                       example: 45
 *                     fleet_revenues:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           plate_number:
 *                             type: string
 *                             example: "Z 1111 TA"
 *                           car_type:
 *                             type: string
 *                             example: "Luxio"
 *                           total_revenue:
 *                             type: number
 *                             example: 750000
 *       401:
 *         description: Tidak terautentikasi (Token JWT tidak valid)
 *       403:
 *         description: Tidak berwenang (Bukan Super Admin)
 */
router.get('/metrics', dashboardController.getDashboardMetrics);

/**
 * @openapi
 * /api/admin/dashboard/active-duties:
 *   get:
 *     summary: Daftar Lengkap Armada Sedang Bertugas (Super Admin)
 *     description: Mengambil seluruh daftar tugas aktif hari ini untuk regular travel rute (RUTE) dan sewa charter pariwisata (BOOKING) secara terpaginasi.
 *     tags:
 *       - Admin Dashboard Area
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Halaman data yang ingin diambil
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Jumlah data per halaman
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar tugas aktif
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
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 */
router.get('/active-duties', dashboardController.getActiveDuties);

/**
 * @openapi
 * /api/admin/dashboard/recent-bookings:
 *   get:
 *     summary: Mendapatkan Riwayat Pemesanan Terbaru (Super Admin)
 *     description: Mengambil daftar pemesakan travel, charter, dan paket yang terbaru masuk untuk ditampilkan di widget dashboard utama.
 *     tags:
 *       - Admin Dashboard Area
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar pemesanan terbaru
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
 *                       type:
 *                         type: string
 *                         example: TRAVEL
 *                       customer_name:
 *                         type: string
 *                         example: "Rafael Pransa"
 *                       date:
 *                         type: string
 *                         format: date-time
 *                       price:
 *                         type: string
 *                         example: "250000.00"
 *                       status:
 *                         type: string
 *                         example: dibayar
 */
router.get('/recent-bookings', dashboardController.getRecentBookings);

module.exports = router;
