const db = require('../config/db');

// Daftar tabel yang diizinkan untuk operasi dinamis (Whitelist Anti SQL Injection)
const ALLOWED_TABLES = ['fleets', 'routes', 'schedules', 'users', 'banners', 'destinations', 'promotions', 'package_shipments', 'institutional_expenses', 'charter_bookings'];

// Kolom sensitif yang TIDAK BOLEH dikembalikan ke client
const SENSITIVE_COLUMNS = ['password'];

/**
 * Memvalidasi bahwa nama tabel termasuk dalam daftar yang diizinkan.
 * @param {string} table - Nama tabel yang akan divalidasi.
 * @throws {Error} Jika nama tabel tidak valid.
 */
const validateTable = (table) => {
  if (!ALLOWED_TABLES.includes(table)) {
    throw new Error(`Operasi pada tabel '${table}' tidak diizinkan.`);
  }
};

/**
 * Menghapus kolom sensitif dari hasil query sebelum dikembalikan ke client.
 * @param {Object|Array} data - Data hasil query.
 * @returns {Object|Array} Data yang sudah disaring.
 */
const sanitizeOutput = (data) => {
  if (Array.isArray(data)) {
    return data.map((record) => {
      const sanitized = { ...record };
      SENSITIVE_COLUMNS.forEach((col) => delete sanitized[col]);
      return sanitized;
    });
  }
  if (data && typeof data === 'object') {
    const sanitized = { ...data };
    SENSITIVE_COLUMNS.forEach((col) => delete sanitized[col]);
    return sanitized;
  }
  return data;
};

const getTableData = async (table) => {
  validateTable(table);
  const records = await db(table).select('*').orderBy('created_at', 'desc');
  return sanitizeOutput(records);
};

const getById = async (table, id) => {
  validateTable(table);
  const record = await db(table).where({ id }).first();
  return sanitizeOutput(record);
};

const createRecord = async (table, data) => {
  validateTable(table);
  try {
    const [record] = await db(table).insert(data).returning('*');
    return sanitizeOutput(record);
  } catch (e) {
    require('fs').appendFileSync('db_error.log', e.message + '\n');
    throw e;
  }
};

const updateRecord = async (table, id, data) => {
  validateTable(table);
  const [record] = await db(table).where({ id }).update(data).returning('*');
  return sanitizeOutput(record);
};

const deleteRecord = async (table, id) => {
  validateTable(table);
  return db(table).where({ id }).del();
};

const getTravelBookings = async () => {
  return db('travel_bookings')
    .join('users', 'travel_bookings.user_id', 'users.id')
    .join('schedules', 'travel_bookings.schedule_id', 'schedules.id')
    .join('routes', 'schedules.route_id', 'routes.id')
    .leftJoin('fleets', 'schedules.fleet_id', 'fleets.id')
    .select(
      'travel_bookings.id',
      'travel_bookings.seat_number',
      'travel_bookings.booking_status',
      'travel_bookings.payment_proof_url',
      'travel_bookings.pickup_address as address_detail',
      'travel_bookings.dropoff_address as destination_detail',
      'travel_bookings.baggage_description',
      'travel_bookings.baggage_weight',
      'travel_bookings.baggage_dimension',
      'travel_bookings.is_baggage_charge',
      'travel_bookings.price',
      'travel_bookings.eta',
      'travel_bookings.payment_method',
      'travel_bookings.schedule_id',
      'travel_bookings.booking_code',
      'travel_bookings.passenger_name',
      'users.name as customer_name',
      'users.phone_number as customer_phone',
      'routes.origin',
      'routes.destination',
      'schedules.departure_time',
      'schedules.fleet_id',
      'schedules.driver_id',
      'schedules.driver_2_id',
      'fleets.plate_number as fleet_plate_number',
      'fleets.car_type as fleet_car_type'
    )
    .orderBy('travel_bookings.created_at', 'desc');
};

const verifyTravelBooking = async (booking_id) => {
  const booking = await db('travel_bookings').where('id', booking_id).first();
  if (!booking) return null;

  let updatePayload = {};
  
  if (booking.booking_status === 'menunggu_konfirmasi') {
    if (booking.payment_proof_url) {
      // Kasus 1: Bukti bayar sudah diunggah, admin memverifikasi pembayaran (Lunas)
      updatePayload = { booking_status: 'dibayar' };
    } else {
      // Kasus 2: Baru diajukan oleh user, admin mengonfirmasi pesanan tersebut
      if (booking.payment_method === 'cashless') {
        // Jika cashless, ubah ke menunggu_pembayaran dan set lock 10 menit
        const locked_until = new Date(Date.now() + 10 * 60000);
        updatePayload = { booking_status: 'menunggu_pembayaran', locked_until };
      } else {
        // Jika cash, langsung ubah ke dibayar (terkonfirmasi)
        updatePayload = { booking_status: 'dibayar' };
      }
    }
  } else {
    return null;
  }

  if (booking.booking_code) {
    await db('travel_bookings')
      .where('booking_code', booking.booking_code)
      .update(updatePayload);
      
    return db('travel_bookings').where('id', booking_id).first();
  }

  const [updated] = await db('travel_bookings')
    .where('id', booking_id)
    .update(updatePayload)
    .returning('*');

  return updated;
};

const updateTravelBookingStatus = async (booking_id, payload) => {
  const booking = await db('travel_bookings').where('id', booking_id).first();
  if (!booking) return null;

  const updatePayload = { ...payload };
  
  if (updatePayload.booking_status) {
    // Kelola seat locking duration
    if (updatePayload.booking_status === 'menunggu_pembayaran') {
      updatePayload.locked_until = new Date(Date.now() + 10 * 60000);
    } else if (updatePayload.booking_status === 'selesai' || updatePayload.booking_status === 'ditolak' || updatePayload.booking_status === 'dibatalkan') {
      updatePayload.locked_until = null;
    }
  }

  if (booking.booking_code) {
    // FIX: Admin memasukkan TOTAL harga untuk seluruh grup.
    // Kita harus membaginya per-kursi sebelum ditulis ke tiap baris,
    // agar ketika frontend menjumlahkan kembali, hasilnya = total yang admin tentukan.
    if (updatePayload.price !== undefined) {
      const groupCountResult = await db('travel_bookings')
        .where('booking_code', booking.booking_code)
        .count('id as count')
        .first();
      const seatCount = parseInt(groupCountResult.count, 10) || 1;
      const pricePerSeat = Math.round(updatePayload.price / seatCount);
      updatePayload.price = pricePerSeat;
      // Samakan original_price dengan price yang di-set admin agar tidak
      // menampilkan diskon palsu di sisi customer.
      updatePayload.original_price = pricePerSeat;
    }

    await db('travel_bookings')
      .where('booking_code', booking.booking_code)
      .update(updatePayload);
      
    return db('travel_bookings').where('id', booking_id).first();
  }

  const [updated] = await db('travel_bookings')
    .where('id', booking_id)
    .update(updatePayload)
    .returning('*');

  return updated;
};

const getPackageShipments = async () => {
  return db('package_shipments')
    .leftJoin('routes', 'package_shipments.route_id', 'routes.id')
    .leftJoin('fleets', 'package_shipments.fleet_id', 'fleets.id')
    .select(
      'package_shipments.id',
      'package_shipments.waybill_number',
      'package_shipments.sender_name',
      'package_shipments.sender_phone',
      'package_shipments.receiver_name',
      'package_shipments.receiver_phone',
      'package_shipments.pickup_address as sender_address_detail',
      'package_shipments.receiver_address as receiver_address_detail',
      'package_shipments.weight',
      'package_shipments.dimension',
      'package_shipments.status',
      'package_shipments.transaction_status',
      'package_shipments.original_price as price',
      'package_shipments.payment_method',
      'package_shipments.payment_proof_url',
      'package_shipments.created_at',
      'routes.origin',
      'routes.destination',
      'fleets.plate_number as fleet_plate_number',
      'fleets.car_type as fleet_car_type'
    )
    .orderBy('package_shipments.created_at', 'desc');
};

const deleteTravelBooking = async (booking_id) => {
  // Jalankan cleanup query untuk membatalkan paket-paket kedaluwarsa
  const now = new Date();
  const localHour = now.getHours();
  let thresholdDate = new Date();
  if (localHour < 14) {
    thresholdDate.setDate(thresholdDate.getDate() - 1);
  }
  const thresholdDateStr = thresholdDate.toISOString().split('T')[0];

  await db('package_shipments')
    .whereNull('fleet_id')
    .where('departure_date', '<=', thresholdDateStr)
    .whereNotIn('status', ['dibatalkan', 'ditolak', 'REJECTED', 'delivered'])
    .update({ status: 'dibatalkan' });

  // Hapus riwayat pesanan travel (Soft Delete agar laporan Admin tetap aman)
  const updatedRows = await db('travel_bookings')
    .where('id', booking_id)
    .update({ is_hidden: true });
  return updatedRows > 0;
};

module.exports = {
  getTableData,
  getById,
  createRecord,
  updateRecord,
  deleteRecord,
  getTravelBookings,
  verifyTravelBooking,
  updateTravelBookingStatus,
  deleteTravelBooking,
  getPackageShipments
};

// force nodemon reload
