const db = require('../config/db');

// Mengambil jadwal aktif beserta ketersediaan kursi
const getSchedules = async ({ date, origin, destination }) => {
  let query = db('schedules')
    .join('routes', 'schedules.route_id', 'routes.id')
    .join('fleets', 'schedules.fleet_id', 'fleets.id')
    .select(
      'schedules.id',
      'routes.origin',
      'routes.destination',
      'routes.base_price',
      'schedules.departure_time',
      'schedules.status',
      'fleets.plate_number',
      'fleets.car_type',
      'fleets.seat_capacity'
    )
    .where('schedules.status', 'scheduled');

  if (origin) query = query.where('routes.origin', origin);
  if (destination) query = query.where('routes.destination', destination);
  if (date) {
    // Pastikan format date adalah YYYY-MM-DD
    query = query.whereRaw('DATE(schedules.departure_time) = ?', [date]);
  }

  const schedules = await query;
  if (schedules.length === 0) {
    return schedules;
  }

  // Batch fetch booking counts to avoid N+1 query problem
  const scheduleIds = schedules.map(s => s.id);
  const bookings = await db('travel_bookings')
    .whereIn('schedule_id', scheduleIds)
    .where(function() {
      this.where('booking_status', 'selesai')
          .orWhere('booking_status', 'menunggu_konfirmasi')
          .orWhere(function() {
            this.where('booking_status', 'menunggu_pembayaran')
                .andWhere('locked_until', '>', db.fn.now());
          });
    })
    .select('schedule_id')
    .count('id as total')
    .groupBy('schedule_id');

  const bookingCounts = {};
  bookings.forEach(b => {
    bookingCounts[b.schedule_id] = parseInt(b.total, 10);
  });

  const enrichedSchedules = schedules.map(schedule => {
    const occupied = bookingCounts[schedule.id] || 0;
    const available_seats = schedule.seat_capacity - occupied;
    return { ...schedule, available_seats };
  });

  return enrichedSchedules;
};

// Cek apakah kursi sedang terkunci atau sudah dipesan
const checkSeatAvailability = async (schedule_id, seat_number) => {
  const existingBooking = await db('travel_bookings')
    .where({ schedule_id, seat_number })
    .where(function() {
      this.where('booking_status', 'selesai')
          .orWhere('booking_status', 'menunggu_konfirmasi')
          .orWhere(function() {
            this.where('booking_status', 'menunggu_pembayaran')
                .andWhere('locked_until', '>', db.fn.now());
          });
    })
    .first();

  return !existingBooking; // True jika tidak ada (tersedia)
};

// Membuat booking baru (status awal: menunggu_konfirmasi, tidak di-lock timer dulu)
const createBooking = async (data) => {
  // Ambil harga dasar rute
  const schedule = await db('schedules')
    .join('routes', 'schedules.route_id', 'routes.id')
    .select('routes.base_price')
    .where('schedules.id', data.schedule_id)
    .first();

  if (!schedule) {
    throw new Error('Jadwal tidak ditemukan');
  }

  let finalPrice = parseFloat(schedule.base_price);

  // Jika promo_id disertakan, hitung potongan harga
  if (data.promo_id) {
    const promo = await db('promotions')
      .where('id', data.promo_id)
      .andWhere('is_active', true)
      .first();
    
    if (promo) {
      const discount = finalPrice * (parseFloat(promo.discount_percentage) / 100);
      finalPrice = finalPrice - discount;
    }
  }

  const [booking] = await db('travel_bookings').insert({
    user_id: data.user_id,
    schedule_id: data.schedule_id,
    seat_number: data.seat_number,
    pickup_address: data.pickup_address,
    dropoff_address: data.dropoff_address,
    payment_method: data.payment_method,
    baggage_description: data.baggage_description || null,
    booking_status: 'menunggu_konfirmasi',
    locked_until: null,
    price: finalPrice,
    promo_id: data.promo_id || null
  }).returning('*');
  
  return booking;
};

// Mengambil manifest penumpang untuk suatu jadwal
const getManifest = async (schedule_id) => {
  return db('travel_bookings')
    .join('users', 'travel_bookings.user_id', 'users.id')
    .select(
      'travel_bookings.seat_number',
      'users.name',
      'users.phone_number',
      'travel_bookings.booking_status',
      'travel_bookings.pickup_address',
      'travel_bookings.dropoff_address',
      'travel_bookings.baggage_description'
    )
    .where('travel_bookings.schedule_id', schedule_id)
    .where('travel_bookings.booking_status', 'selesai')
    .orderBy('travel_bookings.seat_number', 'asc');
};

// Mengambil riwayat tiket user
const getTravelHistory = async (user_id) => {
  return db('travel_bookings')
    .join('schedules', 'travel_bookings.schedule_id', 'schedules.id')
    .join('routes', 'schedules.route_id', 'routes.id')
    .select(
      'travel_bookings.id as booking_id',
      'travel_bookings.seat_number',
      'travel_bookings.booking_status',
      'travel_bookings.pickup_address',
      'travel_bookings.dropoff_address',
      'travel_bookings.baggage_description',
      'travel_bookings.created_at',
      'routes.origin',
      'routes.destination',
      'schedules.departure_time',
      'schedules.status as schedule_status'
    )
    .where('travel_bookings.user_id', user_id)
    .orderBy('travel_bookings.created_at', 'desc');
};

// Mengunggah bukti pembayaran tiket reguler
const uploadPaymentProof = async (booking_id, user_id, file_url) => {
  const [updated] = await db('travel_bookings')
    .where({ id: booking_id, user_id })
    .whereIn('booking_status', ['menunggu_pembayaran', 'menunggu_konfirmasi']) 
    .update({
      payment_proof_url: file_url,
      booking_status: 'menunggu_konfirmasi' // Kembali ke konfirmasi admin setelah bukti diunggah
    })
    .returning('*');
  
  return updated;
};

module.exports = {
  getSchedules,
  checkSeatAvailability,
  createBooking,
  getManifest,
  getTravelHistory,
  uploadPaymentProof
};
