const express = require('express');
const router = express.Router();
const cashflowController = require('../controllers/cashflow.controller');
const { validate, adminValidationSchemas } = require('../middlewares/validation.middleware');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Super Admin: Melihat ringkasan laporan keuangan (Pendapatan, Pengeluaran, Net Profit)
router.get('/summary', authenticate, authorize('super_admin'), cashflowController.getCashflowSummary);

// Super Admin: Mencatat pengeluaran operasional
router.post('/expense', authenticate, authorize('super_admin'), validate(adminValidationSchemas.expense), cashflowController.addExpense);

module.exports = router;
