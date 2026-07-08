const express = require('express');
const router = express.Router();
const travelController = require('../controllers/travel.controller');
const { validate, travelBookingSchema } = require('../middlewares/validation.middleware');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { uploadPayment } = require('../middlewares/upload.middleware');

/**
 * @openapi
 * /api/travel/schedules:
 *   get:
 *     summary: Mencari Jadwal Perjalanan
 *     description: Mengambil semua jadwal perjalanan aktif dengan status 'scheduled'. Menghitung kursi tersedia secara real-time.
 *     tags:
 *       - Travel Regular Service
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Format tanggal YYYY-MM-DD
 *       - in: query
 *         name: origin
 *         schema:
 *           type: string
 *         description: Kota Asal Perjalanan
 *       - in: query
 *         name: destination
 *         schema:
 *           type: string
 *         description: Kota Tujuan Perjalanan
 *     responses:
 *       200:
 *         description: Berhasil mengambil jadwal
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
 *                         example: "sch-uuid-1"
 *                       origin:
 *                         type: string
 *                         example: "Ciamis"
 *                       destination:
 *                         type: string
 *                         example: "Jakarta"
 *                       base_price:
 *                         type: number
 *                         example: 250000
 *                       departure_time:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-06-15T08:00:00.000Z"
 *                       status:
 *                         type: string
 *                         example: "scheduled"
 *                       plate_number:
 *                         type: string
 *                         example: "Z 1234 TA"
 *                       car_type:
 *                         type: string
 *                         example: "Luxio"
 *                       seat_capacity:
 *                         type: integer
 *                         example: 6
 *                       available_seats:
 *                         type: integer
 *                         example: 5
 */
/**
 * @openapi
 * /api/travel/schedules/availability:
 *   get:
 *     summary: Cek Ketersediaan Jadwal Keberangkatan Dinamis
 *     description: Mengambil seluruh tanggal keberangkatan aktif yang masih memiliki kursi atau armada tersedia untuk rute tertentu.
 *     tags:
 *       - Travel Regular Service
 *     parameters:
 *       - in: query
 *         name: route_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID Rute Perjalanan
 *     responses:
 *       200:
 *         description: Berhasil mendapatkan daftar tanggal keberangkatan
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
 *                     type: string
 *                     format: date
 *                     example: "2026-07-11"
 */
router.get('/schedules/availability', travelController.getSchedulesAvailability);

/**
 * @openapi
 * /api/travel/seats:
 *   get:
 *     summary: Mendapatkan Okupansi Kursi Perjalanan
 *     description: Mengambil nomor kursi yang sudah dipesan/dikunci pada jadwal keberangkatan tertentu.
 *     tags:
 *       - Travel Regular Service
 *     parameters:
 *       - in: query
 *         name: schedule_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID Jadwal Perjalanan
 *       - in: query
 *         name: route_id
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID Rute (jika schedule_id tidak disertakan)
 *       - in: query
 *         name: departure_date
 *         schema:
 *           type: string
 *           format: date
 *         description: Tanggal Keberangkatan YYYY-MM-DD (jika schedule_id tidak disertakan)
 *     responses:
 *       200:
 *         description: Berhasil mengambil data okupansi kursi
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
 *                     occupied_seats:
 *                       type: array
 *                       items:
 *                         type: integer
 *                       example: [1, 3]
 *                     locked_seats:
 *                       type: array
 *                       items:
 *                         type: integer
 *                       example: [2]
 *                     capacity:
 *                       type: integer
 *                       example: 6
 */
router.get('/seats', travelController.getSeatsOccupancy);
router.get('/schedules', travelController.getSchedules);

/**
 * @openapi
 * /api/travel/bookings:
 *   post:
 *     summary: Membuat Pemesanan Tiket (Booking)
 *     description: Pemesanan kursi perjalanan reguler untuk mengunci kursi selama 10 menit sebelum pembayaran.
 *     tags:
 *       - Travel Regular Service
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/TravelBookingSchema'
 *     responses:
 *       201:
 *         description: Booking berhasil dibuat
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
 *                   example: Booking berhasil dibuat. Kursi dikunci selama 10 menit, segera lakukan pembayaran.
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "bfa89a31-7e82-4ad6-ac83-d922f30ea1d8"
 *                     user_id:
 *                       type: string
 *                       example: "123e4567-e89b-12d3-a456-426614174000"
 *                     schedule_id:
 *                       type: string
 *                       example: "8c0a25df-32ef-4b47-b50a-3a1b80c55fde"
 *                     seat_number:
 *                       type: integer
 *                       example: 3
 *                     booking_status:
 *                       type: string
 *                       example: "pending"
 *                     locked_until:
 *                       type: string
 *                       format: date-time
 *                       example: "2026-06-07T17:04:13.000Z"
 *                     payment_proof_url:
 *                       type: string
 *                       nullable: true
 *                       example: null
 *       400:
 *         description: Kursi sudah dipesan atau request tidak valid
 */
router.post('/bookings', authenticate, authorize('customer'), validate(travelBookingSchema), travelController.createBooking);

/**
 * @openapi
 * /api/travel/manifest/{schedule_id}:
 *   get:
 *     summary: Melihat Manifest Penumpang
 *     description: Mengambil daftar nama penumpang dan nomor kursi yang berstatus lunas (paid/prepaid) untuk jadwal tertentu.
 *     tags:
 *       - Travel Regular Service
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: schedule_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID jadwal travel
 *     responses:
 *       200:
 *         description: Berhasil mengambil manifest supir
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
 *                       seat_number:
 *                         type: integer
 *                         example: 3
 *                       name:
 *                         type: string
 *                         example: "Rafael Pransa"
 *                       phone_number:
 *                         type: string
 *                         example: "081234567890"
 *                       booking_status:
 *                         type: string
 *                         example: "paid"
 */
router.get('/manifest/:schedule_id', authenticate, authorize('driver', 'super_admin'), travelController.getDriverManifest);

/**
 * @openapi
 * /api/travel/history:
 *   get:
 *     summary: Riwayat Pemesanan Travel Customer
 *     description: Mengambil seluruh riwayat pemesanan travel yang dilakukan oleh customer yang sedang login.
 *     tags:
 *       - Travel Regular Service
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil riwayat travel
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
 *                       booking_id:
 *                         type: string
 *                         example: "bfa89a31-7e82-4ad6-ac83-d922f30ea1d8"
 *                       seat_number:
 *                         type: integer
 *                         example: 3
 *                       booking_status:
 *                         type: string
 *                         example: "locked"
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-06-07T16:54:13.000Z"
 *                       origin:
 *                         type: string
 *                         example: "Ciamis"
 *                       destination:
 *                         type: string
 *                         example: "Jakarta"
 *                       departure_time:
 *                         type: string
 *                         format: date-time
 *                         example: "2026-06-15T08:00:00.000Z"
 *                       schedule_status:
 *                         type: string
 *                         example: "scheduled"
 */
router.get('/history', authenticate, authorize('customer'), travelController.getTravelHistory);

/**
 * @openapi
 * /api/travel/bookings/{id}/payment-proof:
 *   post:
 *     summary: Upload Bukti Pembayaran Tiket Travel
 *     description: Mengunggah file gambar bukti transfer. Mengubah status booking dari 'pending' menjadi 'locked'.
 *     tags:
 *       - Travel Regular Service
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Booking ID
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
 *                 description: File gambar bukti transfer (JPEG/PNG, maks. 5MB)
 *     responses:
 *       200:
 *         description: Bukti pembayaran berhasil diunggah
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
 *                   example: Bukti pembayaran berhasil diunggah. Menunggu verifikasi dari Super Admin.
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     booking_status:
 *                       type: string
 *                       example: locked
 *                     payment_proof_url:
 *                       type: string
 *                       example: "http://localhost:5000/uploads/payments/payment-1686123456789.png"
 */
router.post('/bookings/:id/payment-proof', authenticate, authorize('customer'), uploadPayment.single('payment_proof'), travelController.uploadPaymentProof);

/**
 * @openapi
 * /api/travel/bookings/{id}/payment-method:
 *   put:
 *     summary: Memilih Metode Pembayaran
 *     description: Memilih metode pembayaran (cash atau cashless)
 *     tags:
 *       - Travel Regular Service
 *     security:
 *       - bearerAuth: []
 */
router.put('/bookings/:id/payment-method', authenticate, authorize('customer'), travelController.updatePaymentMethod);

/**
 * @openapi
 * /api/travel/bookings/{id}/cancel:
 *   put:
 *     summary: Membatalkan Pesanan Travel
 *     description: Membatalkan tiket oleh customer
 *     tags:
 *       - Travel Regular Service
 *     security:
 *       - bearerAuth: []
 */
router.put('/bookings/:id/cancel', authenticate, authorize('customer'), travelController.cancelBooking);

/**
 * @openapi
 * /api/travel/bookings/{id}:
 *   delete:
 *     summary: Menghapus Riwayat Pesanan Travel
 *     description: Menghapus riwayat pesanan tiket permanen oleh customer
 *     tags:
 *       - Travel Regular Service
 *     security:
 *       - bearerAuth: []
 */
router.delete('/bookings/:id', authenticate, authorize('customer'), travelController.deleteBooking);

module.exports = router;
