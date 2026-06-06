const { z } = require('zod');

// Schema untuk Register
const registerSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter').max(100),
  email: z.string().email('Format email tidak valid').max(100),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  phone_number: z.string().min(10, 'Nomor telepon tidak valid').max(15)
});

// Schema untuk Login
const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi')
});

// Schema untuk Booking Travel Regular
const travelBookingSchema = z.object({
  schedule_id: z.string().uuid('Format schedule_id tidak valid'),
  seat_number: z.number().int().positive('Nomor kursi harus berupa angka positif')
});

// Middleware Validasi Generic
const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(err => err.message);
      return res.status(400).json({
        status: 'error',
        message: 'Validasi gagal',
        errors: messages
      });
    }
    next(error);
  }
};

module.exports = {
  registerSchema,
  loginSchema,
  travelBookingSchema,
  validate
};
