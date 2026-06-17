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
  seat_number: z.number().int().positive('Nomor kursi harus berupa angka positif'),
  pickup_address: z.string().min(10, 'Alamat penjemputan wajib diisi lengkap (minimal 10 karakter)'),
  dropoff_address: z.string().min(10, 'Alamat tujuan wajib diisi lengkap (minimal 10 karakter)'),
  payment_method: z.enum(['cash', 'cashless'], { errorMap: () => ({ message: "Pilihan metode pembayaran hanya 'cash' atau 'cashless'" }) }),
  baggage_description: z.string().max(500, 'Deskripsi bagasi maksimal 500 karakter').optional(),
  promo_id: z.string().uuid('Format promo_id tidak valid').optional()
});

// Schema untuk Request Charter Pariwisata
const charterRequestSchema = z.object({
  car_type: z.enum(['Luxio', 'Elf'], { errorMap: () => ({ message: "Pilihan armada hanya 'Luxio' atau 'Elf'" }) }),
  destination: z.string().min(3, 'Destinasi wajib diisi'),
  departure_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format departure_date harus YYYY-MM-DD'),
  return_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format return_date harus YYYY-MM-DD'),
  pickup_address: z.string().min(10, 'Alamat penjemputan wajib diisi lengkap (minimal 10 karakter)'),
  dropoff_address: z.string().min(10, 'Alamat tujuan wajib diisi lengkap (minimal 10 karakter)'),
  with_driver: z.boolean().default(false),
  notes: z.string().optional(),
  payment_method: z.enum(['cash', 'cashless'], { errorMap: () => ({ message: "Pilihan metode pembayaran hanya 'cash' atau 'cashless'" }) })
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
  pickup_address: z.string().min(10, 'Alamat penjemputan paket wajib diisi lengkap (minimal 10 karakter)'),
  receiver_name: z.string().min(3, 'Nama penerima wajib diisi'),
  receiver_phone: z.string().min(10, 'Nomor HP penerima tidak valid').max(15),
  receiver_address: z.string().min(10, 'Alamat penerima wajib diisi lengkap (minimal 10 karakter)'),
  package_description: z.string().min(3, 'Deskripsi paket wajib diisi'),
  weight: z.coerce.number().positive('Berat paket harus bernilai positif'),
  dimension: z.enum(['kecil', 'sedang', 'besar', 'super_besar'], { errorMap: () => ({ message: "Pilihan dimensi tidak valid (kecil, sedang, besar, super_besar)" }) }),
  seat_qty: z.coerce.number().int().min(1, 'Jumlah kursi minimal 1').default(1),
  payment_method: z.enum(['cash', 'cashless'], { errorMap: () => ({ message: "Pilihan metode pembayaran hanya 'cash' atau 'cashless'" }) })
});

const packageStatusSchema = z.object({
  status: z.enum(['received', 'sorting', 'on_transit', 'delivered'], { errorMap: () => ({ message: "Status tidak valid" }) })
});

// --- Skema Validasi Super Admin ---
const adminValidationSchemas = {
  fleet: z.object({
    plate_number: z.string().min(1),
    car_type: z.string().min(1),
    seat_capacity: z.number().int().positive(),
    status: z.enum(['active', 'maintenance']).optional()
  }),
  route: z.object({
    origin: z.string().min(1),
    destination: z.string().min(1),
    base_price: z.number().positive()
  }),
  schedule: z.object({
    route_id: z.string().uuid(),
    departure_time: z.string().datetime(),
    status: z.enum(['scheduled', 'board', 'driving', 'completed', 'cancelled']).optional()
  }),
  user: z.object({
    name: z.string().min(1),
    email: z.string().email(),
    password: z.string().min(6).optional(),
    phone_number: z.string().min(10),
    role: z.enum(['customer', 'driver', 'super_admin'])
  }),
  banner: z.object({
    title: z.string().min(1),
    image_url: z.string().url(),
    is_active: z.boolean().optional()
  }),
  destination: z.object({
    name: z.string().min(1),
    description: z.string().min(1),
    image_url: z.string().url()
  }),
  expense: z.object({
    amount: z.number().positive(),
    category: z.string().min(1),
    description: z.string().optional()
  }),
  approveExpense: z.object({
    status: z.enum(['approved', 'rejected'], { errorMap: () => ({ message: "Status persetujuan tidak valid" }) })
  }),
  promotion: z.object({
    tagline: z.string().min(1),
    description: z.string().optional(),
    image_url: z.string().url().optional().or(z.literal('')),
    discount_percentage: z.number().min(0).max(100),
    badge_label: z.string().min(1),
    is_active: z.boolean().optional(),
    promo_type: z.enum(['home', 'service']).optional()
  })
};

// --- Skema Validasi Driver ---
const driverValidationSchemas = {
  scheduleStatus: z.object({
    status: z.enum(['scheduled', 'board', 'driving', 'completed', 'cancelled'], { errorMap: () => ({ message: "Status perjalanan tidak valid" }) })
  }),
  fleetStatus: z.object({
    status: z.enum(['active', 'maintenance'], { errorMap: () => ({ message: "Status armada tidak valid" }) })
  }),
  maintenanceLog: z.object({
    fleet_id: z.string().uuid('Format fleet_id tidak valid'),
    service_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format service_date harus YYYY-MM-DD'),
    description: z.string().min(3, 'Deskripsi minimal 3 karakter'),
    cost: z.coerce.number().nonnegative('Biaya tidak boleh negatif')
  }),
  operationalExpense: z.object({
    schedule_id: z.string().uuid('Format schedule_id tidak valid'),
    amount: z.coerce.number().positive('Jumlah pengeluaran harus berupa angka positif'),
    category: z.enum(['fuel', 'toll', 'parking', 'other'], { errorMap: () => ({ message: "Kategori pengeluaran tidak valid" }) }),
    description: z.string().optional()
  })
};

// Middleware Validasi Generic
const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof z.ZodError) {
      const messages = error.issues.map(err => err.message);
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
  adminValidationSchemas,
  driverValidationSchemas,
  validate
};
