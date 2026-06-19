const express = require('express');
const router = express.Router();
const masterController = require('../controllers/masterData.controller');
const { validate, adminValidationSchemas } = require('../middlewares/validation.middleware');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Gunakan middleware keamanan di semua rute ini (Hanya Super Admin)
router.use(authenticate, authorize('super_admin'));

// Helper CRUD generik (di-import dari modul bersama)
const crudRouteHelper = require('../helpers/crudRoute');
const crudRoute = (path, table, schema) => crudRouteHelper(router, path, table, schema);

/**
 * @openapi
 * /api/admin/cms/promotions:
 *   get:
 *     summary: Mendapatkan Semua Data Promosi (Admin CMS)
 *     description: Mengambil seluruh data promosi (beranda, layanan, all) untuk kebutuhan panel CMS admin.
 *     tags:
 *       - Admin CMS
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data promosi
 *   post:
 *     summary: Menambah Konten Promosi Baru (Admin CMS)
 *     description: Membuat promo baru dengan menyertakan tagline, deskripsi, gambar, persentase diskon, badge, status aktif, dan tipe promo.
 *     tags:
 *       - Admin CMS
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
 * /api/admin/cms/promotions/{id}:
 *   put:
 *     summary: Memperbarui Data Promosi (Admin CMS)
 *     description: Memperbarui rincian konten promosi berdasarkan ID.
 *     tags:
 *       - Admin CMS
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
 *     summary: Menghapus Data Promosi (Admin CMS)
 *     description: Menghapus data promosi dari database berdasarkan ID.
 *     tags:
 *       - Admin CMS
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
 * /api/admin/cms/fleets:
 *   get:
 *     summary: Mendapatkan Semua Data Armada (Admin CMS - Kelola Armada)
 *     description: Mengambil semua data armada terdaftar beserta status operasionalnya.
 *     tags:
 *       - Admin CMS
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data armada
 *   post:
 *     summary: Menambah Armada Baru (Admin CMS - Kelola Armada)
 *     description: Mendaftarkan unit mobil armada baru beserta plat nomor, tipe mobil, kapasitas kursi, dan status.
 *     tags:
 *       - Admin CMS
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
 *         description: Armada baru berhasil terdaftar
 * 
 * /api/admin/cms/fleets/{id}:
 *   put:
 *     summary: Memperbarui Status/Rincian Armada (Admin CMS - Kelola Armada)
 *     description: Memperbarui plat nomor, tipe mobil, kapasitas kursi, atau mengubah status ketersediaan mobil (active / maintenance).
 *     tags:
 *       - Admin CMS
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
 *         description: Data armada berhasil diperbarui
 *   delete:
 *     summary: Menghapus Data Armada (Admin CMS - Kelola Armada)
 *     tags:
 *       - Admin CMS
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
 *         description: Data armada berhasil dihapus
 */

/**
 * @openapi
 * /api/admin/cms/banners:
 *   get:
 *     summary: Mendapatkan Semua Banner Promosi (Admin CMS)
 *     tags:
 *       - Admin CMS
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data banner
 *   post:
 *     summary: Menambah Banner Baru (Admin CMS)
 *     tags:
 *       - Admin CMS
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
 * /api/admin/cms/banners/{id}:
 *   put:
 *     summary: Memperbarui Data Banner (Admin CMS)
 *     tags:
 *       - Admin CMS
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
 *     summary: Menghapus Data Banner (Admin CMS)
 *     tags:
 *       - Admin CMS
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
 * /api/admin/cms/destinations:
 *   get:
 *     summary: Mendapatkan Semua Rekomendasi Destinasi (Admin CMS)
 *     tags:
 *       - Admin CMS
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data destinasi
 *   post:
 *     summary: Menambah Destinasi Baru (Admin CMS)
 *     tags:
 *       - Admin CMS
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
 * /api/admin/cms/destinations/{id}:
 *   put:
 *     summary: Memperbarui Data Destinasi (Admin CMS)
 *     tags:
 *       - Admin CMS
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
 *     summary: Menghapus Data Destinasi (Admin CMS)
 *     tags:
 *       - Admin CMS
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

// CMS CRUD Routes
crudRoute('/promotions', 'promotions', adminValidationSchemas.promotion);
crudRoute('/fleets', 'fleets', adminValidationSchemas.fleet);
crudRoute('/banners', 'banners', adminValidationSchemas.banner);
crudRoute('/destinations', 'destinations', adminValidationSchemas.destination);

module.exports = router;
