const express = require('express');
const router = express.Router();
const packageController = require('../controllers/package.controller');
const { validate, packageShipmentSchema, packageStatusSchema } = require('../middlewares/validation.middleware');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

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
router.post('/shipments', validate(packageShipmentSchema), packageController.createShipment);

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
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PackageStatusSchema'
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
router.put('/shipments/:id/status', authenticate, authorize('driver', 'super_admin'), validate(packageStatusSchema), packageController.updatePackageStatus);

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

module.exports = router;
