const db = require('../config/db');

const createRequest = async (data) => {
  const [booking] = await db('charter_bookings').insert(data).returning('*');
  return booking;
};

const getHistory = async (user_id, role) => {
  const query = db('charter_bookings')
    .join('users', 'charter_bookings.user_id', 'users.id')
    .select(
      'charter_bookings.*',
      'users.name as customer_name',
      'users.phone_number as customer_phone'
    )
    .orderBy('charter_bookings.created_at', 'desc');

  // Jika customer, batasi data hanya milik sendiri
  if (role === 'customer') {
    query.where('charter_bookings.user_id', user_id);
  }

  return query;
};

const updateStatus = async (id, status) => {
  const [updated] = await db('charter_bookings')
    .where({ id })
    .update({ status })
    .returning('*');
  return updated;
};

const getById = async (id) => {
  return db('charter_bookings').where({ id }).first();
};

module.exports = {
  createRequest,
  getHistory,
  updateStatus,
  getById
};
