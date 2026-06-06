const express = require('express');
const router = express.Router();
const packageController = require('../controllers/package.controller');
const { validate, packageShipmentSchema, packageStatusSchema } = require('../middlewares/validation.middleware');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Public: Buat pengiriman paket (Tanpa auth sesuai instruksi database)
router.post('/shipments', validate(packageShipmentSchema), packageController.createShipment);

// Public: Lacak paket berdasarkan nomor resi
router.get('/track/:waybill_number', packageController.trackPackage);

// Driver & Super Admin: Update status paket
router.put('/shipments/:id/status', authenticate, authorize('driver', 'super_admin'), validate(packageStatusSchema), packageController.updatePackageStatus);

module.exports = router;
