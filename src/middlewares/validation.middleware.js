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

// Schema untuk Request Charter Pariwisata
const charterRequestSchema = z.object({
  car_type: z.enum(['Luxio', 'Elf'], { errorMap: () => ({ message: "Pilihan armada hanya 'Luxio' atau 'Elf'" }) }),
  destination: z.string().min(3, 'Destinasi wajib diisi'),
  departure_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format departure_date harus YYYY-MM-DD'),
  return_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format return_date harus YYYY-MM-DD'),
  notes: z.string().optional()
}).refine((data) => {
  return new Date(data.return_date) >= new Date(data.departure_date);
}, {
  message: "Tanggal pulang (return_date) tidak boleh mendahului tanggal berangkat (departure_date)",
  path: ["return_date"]
});

// Schema untuk Pengiriman Paket
const packageShipmentSchema = z.object({
  sender_name: z.string().min(3, 'Nama pengirim wajib diisi'),
  sender_phone: z.string().min(10, 'Nomor HP pengirim tidak valid').max(15),
  receiver_name: z.string().min(3, 'Nama penerima wajib diisi'),
  receiver_phone: z.string().min(10, 'Nomor HP penerima tidak valid').max(15),
  receiver_address: z.string().min(10, 'Alamat penerima wajib diisi lengkap'),
  package_description: z.string().min(3, 'Deskripsi paket wajib diisi')
});

const packageStatusSchema = z.object({
  status: z.enum(['received', 'sorting', 'on_transit', 'delivered'], { errorMap: () => ({ message: "Status tidak valid" }) })
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
  charterRequestSchema,
  packageShipmentSchema,
  packageStatusSchema,
  validate
};
