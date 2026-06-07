const express = require('express');
const router = express.Router();
const charterController = require('../controllers/charter.controller');
const { validate, charterRequestSchema } = require('../middlewares/validation.middleware');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { uploadPayment } = require('../middlewares/upload.middleware');

// Customer: Ajukan sewa (termasuk validasi dan auto kalkulasi harga)
router.post('/request', authenticate, authorize('customer'), validate(charterRequestSchema), charterController.requestCharter);

// Customer: Upload bukti pembayaran charter
router.post('/request/:id/payment-proof', authenticate, authorize('customer'), uploadPayment.single('payment_proof'), charterController.uploadPaymentProof);

// Customer & Super Admin: Melihat riwayat pengajuan
router.get('/history', authenticate, authorize('customer', 'super_admin'), charterController.getCharterHistory);

// Super Admin: Verifikasi bukti pembayaran
router.put('/:id/verify', authenticate, authorize('super_admin'), charterController.verifyCharterPayment);

module.exports = router;
