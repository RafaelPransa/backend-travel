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

  // Hitung kursi tersedia untuk setiap jadwal
  const enrichedSchedules = await Promise.all(schedules.map(async (schedule) => {
    const bookedSeats = await db('travel_bookings')
      .where('schedule_id', schedule.id)
      .where(function() {
        this.whereIn('booking_status', ['paid', 'prepaid'])
            .orWhere('locked_until', '>', db.fn.now());
      })
      .count('id as total');
      
    const occupied = parseInt(bookedSeats[0].total, 10);
    const available_seats = schedule.seat_capacity - occupied;

    return { ...schedule, available_seats };
  }));

  return enrichedSchedules;
};

// Cek apakah kursi sedang terkunci atau sudah dipesan
const checkSeatAvailability = async (schedule_id, seat_number) => {
  const existingBooking = await db('travel_bookings')
    .where({ schedule_id, seat_number })
    .where(function() {
      this.whereIn('booking_status', ['paid', 'prepaid'])
          .orWhere('locked_until', '>', db.fn.now());
    })
    .first();

  return !existingBooking; // True jika tidak ada (tersedia)
};

// Membuat booking baru dan mengunci kursi selama 10 menit
const createBooking = async (data) => {
  const locked_until = new Date(Date.now() + 10 * 60000); // 10 menit dari sekarang
  const [booking] = await db('travel_bookings').insert({
    user_id: data.user_id,
    schedule_id: data.schedule_id,
    seat_number: data.seat_number,
    booking_status: 'pending',
    locked_until: locked_until
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
      'travel_bookings.booking_status'
    )
    .where('travel_bookings.schedule_id', schedule_id)
    .whereIn('travel_bookings.booking_status', ['paid', 'prepaid'])
    .orderBy('travel_bookings.seat_number', 'asc');
};

module.exports = {
  getSchedules,
  checkSeatAvailability,
  createBooking,
  getManifest
};
