const express = require('express');
const router = express.Router();
const contentController = require('../controllers/content.controller');

/**
 * @openapi
 * /api/content/banners:
 *   get:
 *     summary: Mendapatkan Semua Banner Promosi Aktif (Publik)
 *     description: Mengambil semua banner promosi yang berstatus aktif untuk ditampilkan di halaman depan.
 *     tags:
 *       - Public Content
 *     responses:
 *       200:
 *         description: Berhasil mengambil banner promosi aktif
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
 *                   example: Berhasil mengambil banner promosi aktif
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       image_url:
 *                         type: string
 *                       is_active:
 *                         type: boolean
 */
router.get('/banners', contentController.getBanners);

/**
 * @openapi
 * /api/content/destinations:
 *   get:
 *     summary: Mendapatkan Rekomendasi Destinasi Wisata (Publik)
 *     description: Mengambil semua rekomendasi destinasi wisata untuk ditampilkan kepada pengguna.
 *     tags:
 *       - Public Content
 *     responses:
 *       200:
 *         description: Berhasil mengambil rekomendasi destinasi
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
 *                   example: Berhasil mengambil rekomendasi destinasi
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       image_url:
 *                         type: string
 */
router.get('/destinations', contentController.getDestinations);

/**
 * @openapi
 * /api/content/promotions:
 *   get:
 *     summary: Mendapatkan Promosi Aktif (Publik)
 *     description: Mengambil semua promosi aktif, dapat difilter berdasarkan tipe promo (home / service / all).
 *     tags:
 *       - Public Content
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [home, service, all]
 *         description: Filter tipe promosi
 *     responses:
 *       200:
 *         description: Berhasil mengambil data promosi aktif
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
 *                   example: Berhasil mengambil data promosi aktif
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       tagline:
 *                         type: string
 *                       description:
 *                         type: string
 *                       image_url:
 *                         type: string
 *                       discount_percentage:
 *                         type: number
 *                       badge_label:
 *                         type: string
 *                       is_active:
 *                         type: boolean
 *                       promo_type:
 *                         type: string
 */
router.get('/promotions', contentController.getPromotions);
/**
 * @openapi
 * /api/content/routes:
 *   get:
 *     summary: Mendapatkan Semua Rute Aktif
 *     description: Mengambil seluruh daftar rute perjalanan reguler yang tersedia untuk umum.
 *     tags:
 *       - Public Content
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar rute
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
 *                       origin:
 *                         type: string
 *                         example: Jakarta
 *                       destination:
 *                         type: string
 *                         example: Panawangan
 *                       base_price:
 *                         type: string
 *                         example: "250000.00"
 */
router.get('/routes', contentController.getRoutes);

/**
 * @openapi
 * /api/content/fleets/check:
 *   get:
 *     summary: Mengecek Ketersediaan Tipe Armada
 *     description: Mengecek ketersediaan tipe armada pariwisata (charter) pada rentang tanggal tertentu.
 *     tags:
 *       - Public Content
 *     parameters:
 *       - in: query
 *         name: departure_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Tanggal Keberangkatan YYYY-MM-DD
 *       - in: query
 *         name: return_date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *         description: Tanggal Kepulangan YYYY-MM-DD
 *     responses:
 *       200:
 *         description: Berhasil mengecek ketersediaan tipe armada
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     Luxio:
 *                       type: boolean
 *                       example: true
 *                     Elf:
 *                       type: boolean
 *                       example: false
 */
router.get('/fleets/check', contentController.checkFleetsAvailability);

/**
 * @openapi
 * /api/content/fleets:
 *   get:
 *     summary: Mendapatkan Semua Armada Aktif
 *     description: Mengambil data daftar armada mobil beserta kapasitas dan spesifikasi harganya untuk umum.
 *     tags:
 *       - Public Content
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar armada
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
 *                       plate_number:
 *                         type: string
 *                         example: "Z 1234 TA"
 *                       car_type:
 *                         type: string
 *                         example: "Luxio"
 *                       seat_capacity:
 *                         type: integer
 *                         example: 6
 *                       price_description:
 *                         type: string
 *                         example: "Rp 1.200.000 / hari (Dalam Kota)"
 */
router.get('/fleets', contentController.getFleets);

module.exports = router;
