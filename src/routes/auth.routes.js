const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validate, registerSchema, loginSchema } = require('../middlewares/validation.middleware');

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     summary: Registrasi Customer Baru
 *     description: Mendaftarkan customer baru ke dalam sistem. Data divalidasi ketat menggunakan Zod schema.
 *     tags:
 *       - Auth Service
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterSchema'
 *     responses:
 *       201:
 *         description: User berhasil diregistrasi
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
 *                   example: User berhasil diregistrasi
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: 123e4567-e89b-12d3-a456-426614174000
 *                     name:
 *                       type: string
 *                       example: Rafael Pransa
 *                     email:
 *                       type: string
 *                       example: rafael@example.com
 *                     role:
 *                       type: string
 *                       example: customer
 *                     phone_number:
 *                       type: string
 *                       example: "081234567890"
 *                     created_at:
 *                       type: string
 *                       example: "2026-06-07T16:54:13.000Z"
 *       400:
 *         description: Validasi gagal / Email sudah terdaftar
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     summary: Login User
 *     description: Melakukan otentikasi user dan mengembalikan JWT Token jika login berhasil.
 *     tags:
 *       - Auth Service
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginSchema'
 *     responses:
 *       200:
 *         description: Login berhasil
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
 *                   example: Login berhasil
 *                 data:
 *                   type: object
 *                   properties:
 *                     token:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: 123e4567-e89b-12d3-a456-426614174000
 *                         name:
 *                           type: string
 *                           example: Rafael Pransa
 *                         email:
 *                           type: string
 *                           example: rafael@example.com
 *                         role:
 *                           type: string
 *                           example: customer
 *                         phone_number:
 *                           type: string
 *                           example: "081234567890"
 *       400:
 *         description: Validasi gagal
 *       401:
 *         description: Email atau password salah
 */
router.post('/login', validate(loginSchema), authController.login);

module.exports = router;
