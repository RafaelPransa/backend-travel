const express = require('express');
const router = express.Router();
const cashflowController = require('../controllers/cashflow.controller');
const { validate, adminValidationSchemas } = require('../middlewares/validation.middleware');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

/**
 * @openapi
 * /api/admin/cashflow/summary:
 *   get:
 *     summary: Rangkuman Laporan Keuangan (Super Admin)
 *     description: Mengambil rangkuman data pendapatan (dari travel dan charter), pengeluaran operasional, dan net profit.
 *     tags:
 *       - Admin Cashflow Area
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data cashflow
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
 *                     total_income:
 *                       type: number
 *                       example: 15000000
 *                     total_expense:
 *                       type: number
 *                       example: 2000000
 *                     net_profit:
 *                       type: number
 *                       example: 13000000
 */
router.get('/summary', authenticate, authorize('super_admin'), cashflowController.getCashflowSummary);

/**
 * @openapi
 * /api/admin/cashflow/expense:
 *   post:
 *     summary: Mencatat Pengeluaran Operasional (Super Admin)
 *     description: Mencatat pengeluaran operasional (seperti bensin, tol, atau perbaikan armada).
 *     tags:
 *       - Admin Cashflow Area
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminExpenseSchema'
 *     responses:
 *       201:
 *         description: Pengeluaran operasional berhasil dicatat
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
 *                   example: Pengeluaran operasional berhasil dicatat
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     amount:
 *                       type: number
 *                     type:
 *                       type: string
 *                       example: expense
 *                     category:
 *                       type: string
 *                     description:
 *                       type: string
 */
router.post('/expense', authenticate, authorize('super_admin'), validate(adminValidationSchemas.expense), cashflowController.addExpense);

module.exports = router;
