const express = require('express');
const router = express.Router();
const driverController = require('../controllers/driver.controller');
const { validate, driverValidationSchemas } = require('../middlewares/validation.middleware');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Gunakan middleware keamanan di semua rute ini (Hanya Driver)
router.use(authenticate, authorize('driver'));

/**
 * @openapi
 * /api/driver/schedules:
 *   get:
 *     summary: Mendapatkan Tugas Perjalanan Driver
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
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       departure_time:
 *                         type: string
 *                       status:
 *                         type: string
 *                       origin:
 *                         type: string
 *                       destination:
 *                         type: string
 *                       plate_number:
 *                         type: string
 *                       car_type:
 *                         type: string
 *                       passengers:
 *                         type: array
 *                         items:
 *                           type: object
 */
router.get('/schedules', driverController.getMySchedules);

/**
 * @openapi
 * /api/driver/schedules/{id}/status:
 *   put:
 *     summary: Memperbarui Status Perjalanan Driver
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
 *             $ref: '#/components/schemas/DriverScheduleStatusSchema'
 *     responses:
 *       200:
 *         description: Status perjalanan berhasil diperbarui
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
 *                   example: Status perjalanan berhasil diperbarui
 *                 data:
 *                   type: object
 */
router.put('/schedules/:id/status', validate(driverValidationSchemas.scheduleStatus), driverController.updateScheduleStatus);

module.exports = router;
