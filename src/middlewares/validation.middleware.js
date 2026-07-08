const { z } = require('zod');

// Fungsi pembantu untuk memvalidasi pola NIK KTP Indonesia
const validateNIK = (nik) => {
  // 1. Cek panjang dan hanya angka
  if (!/^\d{16}$/.test(nik)) return false;

  // 2. Cek kode wilayah
  const prov = parseInt(nik.substring(0, 2), 10);
  const kabKota = parseInt(nik.substring(2, 4), 10);
  const kec = parseInt(nik.substring(4, 6), 10);

  if (prov < 11 || prov > 95) return false;       // Kode Provinsi valid (11 - 95)
  if (kabKota < 1 || kabKota > 99) return false;  // Kode Kota/Kabupaten tidak boleh 00
  if (kec < 1 || kec > 99) return false;          // Kode Kecamatan tidak boleh 00

  // 3. Cek Tanggal Lahir (digit ke-7 sampai 12)
  let day = parseInt(nik.substring(6, 8), 10);
  const month = parseInt(nik.substring(8, 10), 10);
  const year = parseInt(nik.substring(10, 12), 10);

  // Jika perempuan, tanggal lahir ditambah 40
  if (day > 40) {
    day -= 40;
  }

  // Validasi keaslian tanggal & bulan lahir
  if (day < 1 || day > 31) return false;
  if (month < 1 || month > 12) return false;

  return true;
};

// Schema untuk Register
const registerSchema = z.object({
  name: z.string().min(3, 'Nama minimal 3 karakter').max(100),
  email: z.string().email('Format email tidak valid').max(100),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  phone_number: z.string().min(10, 'Nomor telepon tidak valid').max(15),
  nik: z.string().length(16, 'NIK harus terdiri dari 16 karakter').refine(validateNIK, {
    message: 'Format NIK tidak valid atau tidak sesuai dengan aturan kependudukan Indonesia'
  })
});

// Schema untuk Login
const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi')
});

// Schema untuk Booking Travel Regular
const travelBookingSchema = z.object({
  schedule_id: z.string().uuid('Format schedule_id tidak valid').optional(),
  route_id: z.string().uuid('Format route_id tidak valid').optional(),
  departure_date: z.string().optional(),
  pickup_address: z.string().min(10, 'Alamat penjemputan wajib diisi lengkap (minimal 10 karakter)'),
  dropoff_address: z.string().min(10, 'Alamat tujuan wajib diisi lengkap (minimal 10 karakter)'),
  payment_method: z.enum(['cash', 'cashless'], { errorMap: () => ({ message: "Pilihan metode pembayaran hanya 'cash' atau 'cashless'" }) }).optional().nullable(),
  tujuan_kecamatan: z.string().optional().nullable(),
  promo_id: z.string().uuid('Format promo_id tidak valid').optional().nullable(),
  
  // Single booking (backward compatibility)
  seat_number: z.number().int().positive('Nomor kursi harus berupa angka positif').optional(),
  baggage_description: z.string().max(500, 'Deskripsi bagasi maksimal 500 karakter').optional(),
  baggage_weight: z.coerce.number().positive('Berat bagasi harus bernilai positif').optional(),
  baggage_dimension: z.enum(['kecil', 'sedang', 'besar', 'super_besar'], { errorMap: () => ({ message: "Pilihan dimensi bagasi tidak valid (kecil, sedang, besar, super_besar)" }) }).optional(),

  // Group booking (multi-passengers)
  passengers: z.array(
    z.object({
      seat_number: z.number().int().positive('Nomor kursi harus berupa angka positif'),
      passenger_name: z.string().min(1, 'Nama penumpang harus diisi').max(100),
      baggage_description: z.string().max(500, 'Deskripsi bagasi maksimal 500 karakter').optional().nullable(),
      baggage_weight: z.coerce.number().positive('Berat bagasi harus bernilai positif').optional().nullable(),
      baggage_dimension: z.enum(['kecil', 'sedang', 'besar', 'super_besar'], { errorMap: () => ({ message: "Pilihan dimensi bagasi tidak valid" }) }).optional().nullable()
    })
  ).max(4, 'Maksimal pemesanan adalah 4 kursi').optional()
}).refine(data => {
  return data.passengers || data.seat_number;
}, {
  message: 'Harap sertakan data passengers atau seat_number',
  path: ['passengers']
});

// Schema untuk Request Charter Pariwisata
const charterRequestSchema = z.object({
  car_type: z.string().min(1, "Armada wajib dipilih"),
  destination: z.string().min(3, 'Destinasi wajib diisi'),
  departure_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format departure_date harus YYYY-MM-DD'),
  return_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format return_date harus YYYY-MM-DD'),
  pickup_address: z.string().min(10, 'Alamat penjemputan wajib diisi lengkap (minimal 10 karakter)'),
  dropoff_address: z.string().min(10, 'Alamat tujuan wajib diisi lengkap (minimal 10 karakter)'),
  with_driver: z.boolean().default(false),
  notes: z.string().optional(),
  payment_method: z.enum(['cash', 'cashless'], { errorMap: () => ({ message: "Pilihan metode pembayaran hanya 'cash' atau 'cashless'" }) }).optional()
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
  payment_method: z.enum(['cash', 'cashless'], { errorMap: () => ({ message: "Pilihan metode pembayaran hanya 'cash' atau 'cashless'" }) }).optional(),
  route_id: z.string().uuid('Format route_id tidak valid').optional(),
  departure_date: z.string().optional(),
  total_price: z.coerce.number().nonnegative('Harga total tidak boleh negatif').optional()
});

const packageStatusSchema = z.object({
  status: z.enum(['received', 'sorting', 'on_transit', 'delivered'], { errorMap: () => ({ message: "Status tidak valid" }) })
});

// --- Skema Validasi Super Admin ---
const adminValidationSchemas = {
  fleet: z.object({
    plate_number: z.string().min(1),
    car_type: z.string().min(1),
    seat_capacity: z.coerce.number().int().positive(),
    status: z.enum(['active', 'maintenance']).optional(),
    price: z.coerce.number().nonnegative().optional(),
    description: z.string().optional(),
    image_url: z.string().optional(),
    max_payload: z.coerce.number().int().positive().optional()
  }),
  route: z.object({
    origin: z.string().min(1),
    destination: z.string().min(1),
    base_price: z.coerce.number().positive()
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
    role: z.enum(['customer', 'driver'])
  }),
  userUpdate: z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    password: z.string().min(6).optional(),
    phone_number: z.string().min(10).optional(),
    role: z.enum(['customer', 'driver']).optional()
  }),
  banner: z.object({
    title: z.string().min(1),
    image_url: z.string().optional().or(z.literal('')),
    badge_text: z.string().optional().or(z.literal('')),
    description: z.string().optional().or(z.literal('')),
    is_active: z.boolean().or(z.enum(['true', 'false'])).optional()
  }),
  destination: z.object({
    name: z.string().min(1),
    location: z.string().min(1),
    description: z.string().min(1),
    image_url: z.string().optional().or(z.literal(''))
  }),
  expense: z.object({
    amount: z.coerce.number().positive(),
    type: z.string().min(1),
    pic: z.string().min(1),
    date: z.string().min(1),
    detail: z.string().optional()
  }),
  approveExpense: z.object({
    status: z.enum(['approved', 'rejected'], { errorMap: () => ({ message: "Status persetujuan tidak valid" }) })
  }),
  promotion: z.object({
    tagline: z.string().min(1),
    description: z.string().optional(),
    image_url: z.string().optional().or(z.literal('')),
    discount_percentage: z.coerce.number().min(0).max(100),
    badge_label: z.string().min(1).optional().default('Promo'),
    is_active: z.boolean().or(z.enum(['true', 'false'])).optional(),
    promo_type: z.enum(['home', 'service', 'all']).optional(),
    max_discount: z.coerce.number().min(0).optional().default(0),
    target_service: z.string().optional().default('all')
  }),
  packageShipment: z.object({
    sender_name: z.string().min(3, 'Nama pengirim minimal 3 karakter').optional(),
    sender_phone: z.string().min(10, 'Nomor HP pengirim tidak valid').max(15).optional(),
    pickup_address: z.string().min(10, 'Alamat penjemputan paket minimal 10 karakter').optional(),
    receiver_name: z.string().min(3, 'Nama penerima minimal 3 karakter').optional(),
    receiver_phone: z.string().min(10, 'Nomor HP penerima tidak valid').max(15).optional(),
    receiver_address: z.string().min(10, 'Alamat penerima minimal 10 karakter').optional(),
    package_description: z.string().min(3, 'Deskripsi paket minimal 3 karakter').optional(),
    weight: z.coerce.number().positive('Berat paket harus bernilai positif').optional(),
    dimension: z.enum(['kecil', 'sedang', 'besar', 'super_besar'], { errorMap: () => ({ message: "Pilihan dimensi tidak valid" }) }).optional(),
    payment_method: z.enum(['cash', 'cashless'], { errorMap: () => ({ message: "Pilihan metode pembayaran hanya 'cash' atau 'cashless'" }) }).optional(),
    transaction_status: z.enum(['menunggu_konfirmasi', 'menunggu_pembayaran', 'selesai', 'dibatalkan', 'ditolak']).optional(),
    status: z.enum(['received', 'sorting', 'manifesting', 'on_transit', 'delivered']).optional(),
    route_id: z.string().uuid('Format route_id tidak valid').nullable().optional(),
    fleet_id: z.string().uuid('Format fleet_id tidak valid').nullable().optional(),
    original_price: z.coerce.number().nonnegative('Harga asli tidak boleh negatif').optional()
  }),
  institutionalExpense: z.object({
    expense_type: z.enum(['nib', 'pajak_kendaraan']),
    fleet_id: z.string().uuid().nullable().optional(),
    amount: z.coerce.number().positive('Jumlah pengeluaran harus berupa angka positif'),
    payment_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format payment_date harus YYYY-MM-DD'),
    description: z.string().optional().nullable()
  }),
  verifyCharter: z.object({
    driver_id: z.string().uuid('Format driver_id tidak valid').nullable().optional(),
    fleet_id: z.string().uuid('Format fleet_id tidak valid').nullable().optional(),
    driver_2_id: z.string().uuid('Format driver_2_id tidak valid').nullable().optional(),
    offered_price: z.coerce.number().positive('Harga sewa harus bernilai positif').nullable().optional()
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
  validate,
  forgotPasswordSchema: z.object({
    email: z.string().email('Format email tidak valid').max(100)
  }),
  resetPasswordSchema: z.object({
    token: z.string().min(1, 'Token reset wajib disertakan'),
    newPassword: z.string().min(6, 'Password baru minimal 6 karakter')
  })
};

