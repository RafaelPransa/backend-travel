const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: parseInt(process.env.SMTP_PORT || '587', 10) === 465, // true untuk port 465, false untuk lainnya
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Mengirim email ke pengguna
 * @param {string} to - Alamat email penerima
 * @param {string} subject - Subjek email
 * @param {string} html - Isi email dalam format HTML
 */
const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"PT. Rini Trans Putri" <noreply@rinitransputri.com>',
      to,
      subject,
      html,
    });
    console.log('Email sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Send Email Error:', error);
    throw new Error('Gagal mengirim email pemulihan sandi');
  }
};

module.exports = { sendEmail };
