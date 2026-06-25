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
router.get('/routes', contentController.getRoutes);
router.get('/fleets/check', contentController.checkFleetsAvailability);
router.get('/fleets', contentController.getFleets);

module.exports = router;
