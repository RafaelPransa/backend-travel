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

module.exports = router;
