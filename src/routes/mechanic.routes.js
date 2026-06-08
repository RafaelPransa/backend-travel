const express = require('express');
const router = express.Router();
const mechanicController = require('../controllers/mechanic.controller');
const { validate, mechanicValidationSchemas } = require('../middlewares/validation.middleware');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Keamanan: Hanya user dengan role 'mechanic' atau 'super_admin' yang dapat mengakses
router.use(authenticate, authorize('mechanic', 'super_admin'));

/**
 * @openapi
 * /api/mechanic/fleets:
 *   get:
 *     summary: Mendapatkan Semua Armada & Statusnya (Mekanik & Admin)
 *     description: Mengambil daftar seluruh unit mobil beserta status terkininya (active/maintenance).
 *     tags:
 *       - Mechanic Area
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data armada
 */
router.get('/fleets', mechanicController.getFleets);

/**
 * @openapi
 * /api/mechanic/fleets/{id}/status:
 *   put:
 *     summary: Memperbarui Status Armada (Mekanik & Admin)
 *     description: Mengubah status unit mobil menjadi aktif ('active') atau perbaikan ('maintenance').
 *     tags:
 *       - Mechanic Area
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
 *             $ref: '#/components/schemas/MechanicFleetStatusSchema'
 *     responses:
 *       200:
 *         description: Status armada berhasil diperbarui
 */
router.put('/fleets/:id/status', validate(mechanicValidationSchemas.fleetStatus), mechanicController.updateFleetStatus);

/**
 * @openapi
 * /api/mechanic/maintenance-logs:
 *   get:
 *     summary: Mendapatkan Histori Log Perawatan (Mekanik & Admin)
 *     description: Mengambil daftar histori perawatan/servis semua armada.
 *     tags:
 *       - Mechanic Area
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil log perawatan
 *   post:
 *     summary: Menambahkan Log Perawatan Baru (Mekanik & Admin)
 *     description: Catat histori perbaikan mobil baru beserta deskripsi dan biaya servisnya.
 *     tags:
 *       - Mechanic Area
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MechanicMaintenanceLogSchema'
 *     responses:
 *       201:
 *         description: Catatan perawatan berhasil dibuat
 */
router.get('/maintenance-logs', mechanicController.getMaintenanceLogs);
router.post('/maintenance-logs', validate(mechanicValidationSchemas.maintenanceLog), mechanicController.createMaintenanceLog);

module.exports = router;
