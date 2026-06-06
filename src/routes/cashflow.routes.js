const express = require('express');
const router = express.Router();
const cashflowController = require('../controllers/cashflow.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Super Admin: Melihat ringkasan laporan keuangan (Pendapatan, Pengeluaran, Net Profit)
router.get('/summary', authenticate, authorize('super_admin'), cashflowController.getCashflowSummary);

module.exports = router;
