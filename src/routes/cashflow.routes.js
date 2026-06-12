const express = require('express');
const router = express.Router();
const cashflowController = require('../controllers/cashflow.controller');
const { validate, adminValidationSchemas } = require('../middlewares/validation.middleware');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Gunakan middleware keamanan di semua rute ini (Hanya Super Admin)
router.use(authenticate, authorize('super_admin'));

/**
 * @openapi
 * /api/admin/cashflow/summary:
 *   get:
 *     summary: Rangkuman Laporan Keuangan (Super Admin)
 *     description: Mengambil rangkuman data pendapatan (dari travel dan charter), pengeluaran operasional, dan net profit. Mendukung filter rentang waktu.
 *     tags:
 *       - Admin Cashflow Area
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: filter
 *         schema:
 *           type: string
 *           enum: [weekly, monthly, yearly]
 *         description: Rentang waktu rangkuman kas
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
 *                 message:
 *                   type: string
 *                   example: Berhasil mengambil ringkasan kas keuangan
 *                 data:
 *                   type: object
 */
router.get('/summary', cashflowController.getCashflowSummary);

/**
 * @openapi
 * /api/admin/cashflow/expense:
 *   post:
 *     summary: Mencatat Pengeluaran Operasional Langsung (Super Admin)
 *     description: Mencatat pengeluaran operasional admin langsung (seperti perbaikan kantor, sewa, atau perbaikan armada).
 *     tags:
 *       - Admin Cashflow Area
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - category
 *             properties:
 *               amount:
 *                 type: number
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Pengeluaran operasional berhasil dicatat
 */
router.post('/expense', validate(adminValidationSchemas.expense), cashflowController.addExpense);

/**
 * @openapi
 * /api/admin/cashflow/expenses:
 *   get:
 *     summary: Mendapatkan Histori Biaya Operasional Driver (Super Admin)
 *     description: Mengambil seluruh pengajuan biaya jalan (bensin, tol, parkir) dari driver beserta statusnya (pending/approved/rejected).
 *     tags:
 *       - Admin Cashflow Area
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected]
 *         description: Filter pengeluaran berdasarkan status persetujuan
 *     responses:
 *       200:
 *         description: Berhasil mengambil daftar pengeluaran operasional driver
 */
router.get('/expenses', cashflowController.getDriverExpenses);

/**
 * @openapi
 * /api/admin/cashflow/expenses/{id}/approve:
 *   put:
 *     summary: Menyetujui atau Menolak Biaya Operasional Driver (Super Admin)
 *     description: Mengubah status pengajuan pengeluaran driver menjadi disetujui (approved) atau ditolak (rejected). Jika disetujui, trigger DB otomatis membuat kas keluar di cashflows.
 *     tags:
 *       - Admin Cashflow Area
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID Pengeluaran Driver (operational_expenses.id)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *     responses:
 *       200:
 *         description: Status pengeluaran berhasil diubah
 */
router.put('/expenses/:id/approve', validate(adminValidationSchemas.approveExpense), cashflowController.approveExpense);

module.exports = router;
