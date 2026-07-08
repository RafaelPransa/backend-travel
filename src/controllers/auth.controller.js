const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');
const { sendEmail } = require('../config/mailer');
const db = require('../config/db');



const register = async (req, res) => {
  try {
    const { name, email, password, phone_number, nik } = req.body;

    // Cek apakah email sudah terdaftar
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Email sudah terdaftar'
      });
    }

    // Cek apakah NIK sudah terdaftar
    const existingNIK = await db('users').where({ nik }).first();
    if (existingNIK) {
      return res.status(400).json({
        status: 'error',
        message: 'NIK sudah terdaftar'
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
      phone_number,
      nik
    });

    // Kirim email selamat datang
    const emailHtml = `
      <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #0284c7; text-align: center; border-bottom: 2px solid #0284c7; padding-bottom: 10px;">Registrasi Berhasil!</h2>
        <p>Halo <strong>${name}</strong>,</p>
        <p>Selamat bergabung di layanan transportasi kami. Akun Anda telah berhasil dibuat.</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 20px;">
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold; width: 120px;">Nama:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${name}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">Email:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${email}</td>
          </tr>
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">NIK KTP:</td>
            <td style="padding: 8px; border-bottom: 1px solid #ddd;">${nik}</td>
          </tr>
        </table>
        <p style="margin-top: 20px; text-align: center;">
          <a href="https://rinitransputri.my.id" style="background-color: #0284c7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Mulai Pesan Layanan</a>
        </p>
        <br>
        <p style="font-size: 0.9em; color: #666; margin-bottom: 5px;">Salam hangat,</p>
        <p style="font-size: 0.9em; color: #666; font-weight: bold; margin-top: 0;">PT. Rini Trans Putri</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 0.8em; color: #999; text-align: center; line-height: 1.5;">
          Email ini dikirimkan secara otomatis oleh sistem pendaftaran PT. Rini Trans Putri.<br>
          Kantor Pusat: Jl. Terusan Jakarta No. 175, Antapani, Bandung, Jawa Barat, Indonesia.<br>
          Jika Anda tidak merasa melakukan pendaftaran ini, harap abaikan email ini.
        </p>
      </div>
    `;

    const emailText = `Registrasi Berhasil! Halo ${name}, selamat bergabung di layanan transportasi PT. Rini Trans Putri. Akun Anda telah berhasil dibuat dengan NIK KTP: ${nik} dan Email: ${email}. Kantor Pusat: Jl. Terusan Jakarta No. 175, Antapani, Bandung, Jawa Barat.`;

    try {
      await sendEmail(email, 'Registrasi Akun Rini Trans Putri Berhasil', emailHtml, emailText);
    } catch (mailError) {
      console.error('Email send failed during registration:', mailError);
    }

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
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4321';
    const resetLink = `${frontendUrl}/auth/reset-password?token=${rawToken}`;

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
