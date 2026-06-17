const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { validate, registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } = require('../middlewares/validation.middleware');


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

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     summary: Meminta Tautan Reset Password
 *     description: Mengirim email berisi tautan token reset password ke pengguna jika email terdaftar.
 *     tags:
 *       - Auth Service
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: rafael@example.com
 *     responses:
 *       200:
 *         description: Permintaan sukses diproses (baik email terdaftar maupun tidak)
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
 *                   example: Jika email terdaftar di sistem kami, instruksi pemulihan sandi telah dikirim.
 *       400:
 *         description: Format email tidak valid
 *       500:
 *         description: Internal server error
 */
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);

/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     summary: Mereset Password Baru
 *     description: Melakukan pembaruan kata sandi menggunakan token yang dikirim via email.
 *     tags:
 *       - Auth Service
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *                 example: 6a2c9f5d3...
 *               newPassword:
 *                 type: string
 *                 example: passwordBaru123
 *     responses:
 *       200:
 *         description: Password berhasil direset
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
 *                   example: Kata sandi Anda berhasil diperbarui. Silakan login kembali.
 *       400:
 *         description: Token tidak valid atau kadaluarsa
 *       500:
 *         description: Internal server error
 */
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

module.exports = router;

