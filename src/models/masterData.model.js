const db = require('../config/db');

// Daftar tabel yang diizinkan untuk operasi dinamis (Whitelist Anti SQL Injection)
const ALLOWED_TABLES = ['fleets', 'routes', 'schedules', 'users', 'banners', 'destinations'];

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

const getTableData = async (table) => {
  validateTable(table);
  return db(table).select('*').orderBy('created_at', 'desc');
};

const getById = async (table, id) => {
  validateTable(table);
  return db(table).where({ id }).first();
};

const createRecord = async (table, data) => {
  validateTable(table);
  const [record] = await db(table).insert(data).returning('*');
  return record;
};

const updateRecord = async (table, id, data) => {
  validateTable(table);
  const [record] = await db(table).where({ id }).update(data).returning('*');
  return record;
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
    .select(
      'travel_bookings.id',
      'travel_bookings.seat_number',
      'travel_bookings.booking_status',
      'travel_bookings.payment_proof_url',
      'users.name as customer_name',
      'routes.origin',
      'routes.destination',
      'schedules.departure_time'
    )
    .orderBy('travel_bookings.created_at', 'desc');
};

const verifyTravelBooking = async (booking_id) => {
  const [updated] = await db('travel_bookings')
    .where('id', booking_id)
    .where('booking_status', 'locked') // Admin hanya bisa verif yang sudah upload bukti (locked)
    .update({ booking_status: 'paid' })
    .returning('*');
  return updated;
};

module.exports = {
  getTableData,
  getById,
  createRecord,
  updateRecord,
  deleteRecord,
  getTravelBookings,
  verifyTravelBooking
};
