const db = require('../config/db');

const getTableData = async (table) => {
  return db(table).select('*').orderBy('created_at', 'desc');
};

const getById = async (table, id) => {
  return db(table).where({ id }).first();
};

const createRecord = async (table, data) => {
  const [record] = await db(table).insert(data).returning('*');
  return record;
};

const updateRecord = async (table, id, data) => {
  const [record] = await db(table).where({ id }).update(data).returning('*');
  return record;
};

const deleteRecord = async (table, id) => {
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
