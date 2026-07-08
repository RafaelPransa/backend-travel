const express = require('express');
const router = express.Router();
const packageController = require('../controllers/package.controller');
const { validate, packageShipmentSchema, packageStatusSchema } = require('../middlewares/validation.middleware');
const { authenticate, optionalAuth, authorize } = require('../middlewares/auth.middleware');
const { uploadPackage, uploadPayment } = require('../middlewares/upload.middleware');

/**
 * @openapi
 * /api/packages/availability:
 *   get:
 *     summary: Mengecek Ketersediaan Armada untuk Paket
 *     description: Mengecek apakah ada armada yang tersedia pada tanggal tertentu untuk pengiriman paket.
 *     tags:
 *       - Package Shipment (Kurir) Service
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Berhasil mengambil ketersediaan
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     available:
 *                       type: boolean
 */
router.get('/availability', packageController.checkAvailability);

/**
 * @openapi
 * /api/packages/shipments:
 *   post:
 *     summary: Membuat Pengiriman Paket Baru
 *     description: Mendaftarkan paket kiriman baru. Tiket resi format 'RTP-[HEX-10-Karakter]' otomatis dibuat.
 *     tags:
 *       - Package Shipment (Kurir) Service
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PackageShipmentSchema'
 *     responses:
 *       201:
 *         description: Pengiriman paket berhasil dibuat
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
 *                   example: Pengiriman paket berhasil dibuat
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     waybill_number:
 *                       type: string
 *                       example: "RTP-D3F2E1A4C5"
 *                     sender_name:
 *                       type: string
 *                       example: "Agus"
 *                     receiver_name:
 *                       type: string
 *                       example: "Siti"
 *                     receiver_address:
 *                       type: string
 *                       example: "Jl. Merdeka No.1, Jakarta Pusat"
 *                     package_description:
 *                       type: string
 *                       example: "Dokumen Penting"
 *                     status:
 *                       type: string
 *                       example: "received"
 */
router.post('/shipments', optionalAuth, validate(packageShipmentSchema), packageController.createShipment);

/**
 * @openapi
 * /api/packages/track/{waybill_number}:
 *   get:
 *     summary: Melacak Status Paket
 *     description: Melacak rincian perjalanan paket berdasarkan nomor resi.
 *     tags:
 *       - Package Shipment (Kurir) Service
 *     parameters:
 *       - in: path
 *         name: waybill_number
 *         required: true
 *         schema:
 *           type: string
 *         description: Nomor resi paket (contoh RTP-D3F2E1A4C5)
 *     responses:
 *       200:
 *         description: Data paket ditemukan
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
 *                     waybill_number:
 *                       type: string
 *                     sender_name:
 *                       type: string
 *                     receiver_name:
 *                       type: string
 *                     receiver_address:
 *                       type: string
 *                     package_description:
 *                       type: string
 *                     status:
 *                       type: string
 *                       example: on_transit
 */
router.get('/track/:waybill_number', packageController.trackPackage);

/**
 * @openapi
 * /api/packages/shipments/{id}/status:
 *   put:
 *     summary: Memperbarui Status Paket (Driver & Admin)
 *     description: Driver atau Super Admin memperbarui status pergerakan paket.
 *     tags:
 *       - Package Shipment (Kurir) Service
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Package ID (UUID)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [received, sorting, on_transit, delivered]
 *                 description: Status terbaru dari pengiriman paket
 *               proof_image:
 *                 type: string
 *                 format: binary
 *                 description: File foto serah terima fisik (Wajib jika status adalah delivered)
 *     responses:
 *       200:
 *         description: Status paket berhasil diperbarui
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
 *                   example: Status paket berhasil diperbarui
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     status:
 *                       type: string
 *                       example: on_transit
 *                     waybill_number:
 *                       type: string
 */
router.put('/shipments/:id/status', authenticate, authorize('driver', 'super_admin'), uploadPackage.single('proof_image'), validate(packageStatusSchema), packageController.updatePackageStatus);

/**
 * @openapi
 * /api/packages/history:
 *   get:
 *     summary: Riwayat Pengiriman Paket
 *     description: Melihat riwayat kiriman paket yang didaftarkan oleh customer yang sedang login.
 *     tags:
 *       - Package Shipment (Kurir) Service
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil riwayat paket
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
 *                       waybill_number:
 *                         type: string
 *                       sender_name:
 *                         type: string
 *                       receiver_name:
 *                         type: string
 *                       package_description:
 *                         type: string
 *                       status:
 *                         type: string
 */
router.get('/history', authenticate, authorize('customer'), packageController.getPackageHistory);

/**
 * @openapi
 * /api/packages/bookings/{id}/cancel:
 *   put:
 *     summary: Batalkan Pengiriman Paket
 *     description: Membatalkan pengiriman paket yang belum diproses oleh kurir/supir.
 *     tags:
 *       - Package Shipment (Kurir) Service
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID Pengiriman Paket
 *     responses:
 *       200:
 *         description: Pengiriman paket berhasil dibatalkan
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
 *                   example: Pengiriman paket berhasil dibatalkan
 */
router.put('/bookings/:id/cancel', authenticate, authorize('customer'), packageController.cancelBooking);

/**
 * @openapi
 * /api/packages/bookings/{id}:
 *   delete:
 *     summary: Hapus/Arsipkan Riwayat Paket
 *     description: Menyembunyikan riwayat transaksi pengiriman paket dari dashboard customer (soft-delete/hide).
 *     tags:
 *       - Package Shipment (Kurir) Service
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID Pengiriman Paket
 *     responses:
 *       200:
 *         description: Riwayat paket berhasil dihapus/diarsipkan
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
 *                   example: Riwayat pengiriman berhasil disembunyikan
 */
router.delete('/bookings/:id', authenticate, authorize('customer'), packageController.deleteBooking);

/**
 * @openapi
 * /api/packages/bookings/{id}/payment-method:
 *   put:
 *     summary: Mengubah Metode Pembayaran Paket
 *     description: Mengubah metode pembayaran paket (misal dari cashless ke cash) sebelum dikonfirmasi oleh admin.
 *     tags:
 *       - Package Shipment (Kurir) Service
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID Pengiriman Paket
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payment_method
 *             properties:
 *               payment_method:
 *                 type: string
 *                 enum: [cash, cashless]
 *                 example: cash
 *     responses:
 *       200:
 *         description: Metode pembayaran berhasil diperbarui
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
 *                   example: Metode pembayaran berhasil diperbarui
 */
router.put('/bookings/:id/payment-method', authenticate, authorize('customer'), packageController.updatePaymentMethod);

/**
 * @openapi
 * /api/packages/shipments/{id}/payment-proof:
 *   post:
 *     summary: Unggah Bukti Pembayaran Paket (Cashless)
 *     description: Customer mengunggah foto bukti transfer untuk pembayaran paket.
 *     tags:
 *       - Package Shipment (Kurir) Service
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - proofImage
 *             properties:
 *               proofImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Bukti pembayaran berhasil diunggah
 */
router.post('/shipments/:id/payment-proof', authenticate, authorize('customer'), uploadPayment.single('payment_proof'), packageController.uploadPaymentProof);

module.exports = router;
