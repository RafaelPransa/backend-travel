const express = require('express');
const router = express.Router();
const charterController = require('../controllers/charter.controller');
const { validate, charterRequestSchema, adminValidationSchemas } = require('../middlewares/validation.middleware');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { uploadPayment } = require('../middlewares/upload.middleware');

/**
 * @openapi
 * /api/charter/availability:
 *   get:
 *     summary: Cek Ketersediaan Armada Charter
 *     description: Mengembalikan data sisa ketersediaan armada berdasarkan tanggal.
 *     tags:
 *       - Charter (Pariwisata) Service
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: Tanggal yang ingin dicek (YYYY-MM-DD)
 */
// router.get('/availability', charterController.checkAvailability);

/**
 * @openapi
 * /api/charter/request:
 *   post:
 *     summary: Mengajukan Sewa Charter (Pariwisata)
 *     description: Mengajukan sewa pariwisata. Sistem menghitung jumlah hari sewa secara inklusif dan total harga otomatis berdasarkan jenis armada.
 *     tags:
 *       - Charter (Pariwisata) Service
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CharterRequestSchema'
 *     responses:
 *       201:
 *         description: Pengajuan charter berhasil dibuat
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
 *                   example: Pengajuan charter berhasil dibuat. Silakan lakukan pembayaran.
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     user_id:
 *                       type: string
 *                     car_type:
 *                       type: string
 *                       example: "Luxio"
 *                     destination:
 *                       type: string
 *                       example: "Pangandaran"
 *                     departure_date:
 *                       type: string
 *                       example: "2026-07-01"
 *                     return_date:
 *                       type: string
 *                       example: "2026-07-03"
 *                     offered_price:
 *                       type: number
 *                       example: 3600000
 *                     status:
 *                       type: string
 *                       example: "pending"
 *                     total_days:
 *                       type: integer
 *                       example: 3
 */
router.post('/request', authenticate, authorize('customer'), validate(charterRequestSchema), charterController.requestCharter);

/**
 * @openapi
 * /api/charter/request/{id}/payment-proof:
 *   post:
 *     summary: Upload Bukti Pembayaran Sewa Charter
 *     description: Mengunggah file gambar bukti pembayaran sewa charter.
 *     tags:
 *       - Charter (Pariwisata) Service
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
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               payment_proof:
 *                 type: string
 *                 format: binary
 *                 description: File bukti transfer (JPEG/PNG, maks. 5MB)
 *     responses:
 *       200:
 *         description: Bukti pembayaran charter berhasil diunggah
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
 *                     id:
 *                       type: string
 *                     status:
 *                       type: string
 *                       example: pending
 *                     payment_proof_url:
 *                       type: string
 *                       example: "http://localhost:5000/uploads/payments/payment-1686123456789.png"
 */
router.post('/request/:id/payment-proof', authenticate, authorize('customer'), uploadPayment.single('payment_proof'), charterController.uploadPaymentProof);

/**
 * @openapi
 * /api/charter/history:
 *   get:
 *     summary: Riwayat Pengajuan Charter
 *     description: Customer melihat riwayat pribadinya. Super Admin melihat seluruh riwayat sewa charter dari seluruh pengguna.
 *     tags:
 *       - Charter (Pariwisata) Service
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil riwayat charter
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
 *                       car_type:
 *                         type: string
 *                       destination:
 *                         type: string
 *                       offered_price:
 *                         type: string
 *                       status:
 *                         type: string
 *                       customer_name:
 *                         type: string
 */
router.get('/history', authenticate, authorize('customer', 'super_admin'), charterController.getCharterHistory);

/**
 * @openapi
 * /api/charter/{id}/verify:
 *   put:
 *     summary: Verifikasi Pembayaran Charter (Super Admin)
 *     description: Super Admin memverifikasi bukti pembayaran sewa charter. Status berubah menjadi 'paid'.
 *     tags:
 *       - Charter (Pariwisata) Service
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
 *     responses:
 *       200:
 *         description: Pembayaran sewa berhasil diverifikasi
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
 *                   example: Pembayaran charter berhasil diverifikasi
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     status:
 *                       type: string
 *                       example: paid
 */
router.put('/:id/verify', authenticate, authorize('super_admin'), validate(adminValidationSchemas.verifyCharter), charterController.verifyCharterPayment);

/**
 * @openapi
 * /api/charter/request/{id}/payment-method:
 *   put:
 *     summary: Memilih Metode Pembayaran
 *     description: Memilih metode pembayaran (cash atau cashless)
 *     tags:
 *       - Charter Request
 *     security:
 *       - bearerAuth: []
 */
// router.put('/request/:id/payment-method', authenticate, authorize('customer'), charterController.updatePaymentMethod);

// Supaya endpoint frontend konsisten: /api/charter/bookings/:id/cancel
// router.put('/bookings/:id/cancel', authenticate, authorize('customer'), charterController.cancelBooking);
// router.delete('/bookings/:id', authenticate, authorize('customer'), charterController.deleteBooking);

module.exports = router;
