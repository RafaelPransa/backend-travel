const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');
const { sendEmail } = require('../config/mailer');
const db = require('../config/db');



const register = async (req, res) => {
  try {
    const { name, email, password, phone_number } = req.body;

    // Cek apakah email sudah terdaftar
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Email sudah terdaftar'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Simpan user baru (role default 'customer' sesuai skema database)
    const newUser = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      phone_number
    });

    return res.status(201).json({
      status: 'success',
      message: 'Registrasi berhasil',
      data: newUser
    });
  } catch (error) {
    console.error('Register Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server'
    });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Cari user
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Email atau password salah'
      });
    }

    // Bandingkan password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: 'error',
        message: 'Email atau password salah'
      });
    }

    // Buat payload JWT (hanya data esensial agar token tetap ringan)
    const payload = {
      id: user.id,
      name: user.name,
      role: user.role
    };

    // Generate JWT
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '24h' // Token valid 1 hari
    });

    return res.status(200).json({
      status: 'success',
      message: 'Login berhasil',
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          phone_number: user.phone_number
        }
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server'
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // 1. Cari user berdasarkan email
    const user = await UserModel.findByEmail(email);
    if (!user) {
      // Demi keamanan, kembalikan pesan sukses yang sama
      return res.status(200).json({
        status: 'success',
        message: 'Jika email terdaftar di sistem kami, instruksi pemulihan sandi telah dikirim.'
      });
    }

    // 2. Buat token acak yang aman (clear text)
    const rawToken = crypto.randomBytes(32).toString('hex');

    // 3. Hash token tersebut sebelum disimpan di database (keamanan ekstra)
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    // 4. Set waktu kadaluarsa (1 jam dari sekarang)
    const tokenExpires = new Date(Date.now() + 3600000); // 1 jam = 3600000 ms

    // 5. Update data token ke database user menggunakan Knex
    await db('users')
      .where({ id: user.id })
      .update({
        reset_password_token: hashedToken,
        reset_password_expires: tokenExpires,
        updated_at: db.fn.now()
      });

    // 6. Buat link reset password untuk dikirim ke email
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;

    // 7. Template email HTML
    const emailContent = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #333; text-align: center;">Pemulihan Kata Sandi</h2>
        <p>Halo, ${user.name}</p>
        <p>Kami menerima permintaan untuk mereset kata sandi akun Anda di PT. Rini Trans Putri.</p>
        <p>Silakan klik tautan di bawah ini untuk mereset kata sandi Anda. Tautan ini hanya berlaku selama <strong>1 jam</strong>:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetLink}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Reset Kata Sandi</a>
        </div>
        <p>Jika Anda tidak meminta pemulihan ini, harap abaikan email ini. Kata sandi Anda akan tetap aman.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin-top: 30px;">
        <p style="font-size: 12px; color: #888; text-align: center;">Ini adalah email otomatis, mohon tidak membalas email ini.</p>
      </div>
    `;

    // 8. Kirim email
    await sendEmail(user.email, 'Pemulihan Kata Sandi - PT. Rini Trans Putri', emailContent);

    return res.status(200).json({
      status: 'success',
      message: 'Jika email terdaftar di sistem kami, instruksi pemulihan sandi telah dikirim.'
    });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server'
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // 1. Hash token input agar cocok dengan token di DB
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // 2. Cari user yang memiliki token yang valid dan belum kadaluarsa
    const user = await db('users')
      .where('reset_password_token', hashedToken)
      .andWhere('reset_password_expires', '>', new Date())
      .first();

    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Token reset password tidak valid atau telah kadaluarsa'
      });
    }

    // 3. Hash password baru
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 4. Update password dan kosongkan field reset_password_*
    await db('users')
      .where({ id: user.id })
      .update({
        password: hashedPassword,
        reset_password_token: null,
        reset_password_expires: null,
        updated_at: db.fn.now()
      });

    return res.status(200).json({
      status: 'success',
      message: 'Kata sandi Anda berhasil diperbarui. Silakan login kembali.'
    });
  } catch (error) {
    console.error('Reset Password Error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada server'
    });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword
};
