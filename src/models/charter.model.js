const db = require('../config/db');

const createRequest = async (data) => {
  // Auto-alokasi unit
  if (!data.fleet_id) {
    const availableFleet = await db('fleets').where({ status: 'available' }).first();
    data.fleet_id = availableFleet ? availableFleet.id : null;
  }
  
  const [booking] = await db('charter_bookings').insert(data).returning('*');
  return booking;
};

const getHistory = async (user_id, role) => {
  const query = db('charter_bookings')
    .join('users', 'charter_bookings.user_id', 'users.id')
    .leftJoin('users as driver', 'charter_bookings.driver_id', 'driver.id')
    .leftJoin('users as driver_2', 'charter_bookings.driver_2_id', 'driver_2.id')
    .leftJoin('fleets', 'charter_bookings.fleet_id', 'fleets.id')
    .select(
      'charter_bookings.*',
      'users.name as customer_name',
      'users.phone_number as customer_phone',
      'driver.name as driver_name',
      'driver_2.name as driver_2_name',
      'fleets.plate_number',
      'fleets.car_type as fleet_car_type'
    )
    .orderBy('charter_bookings.created_at', 'desc');

  // Jika customer, batasi data hanya milik sendiri
  if (role === 'customer') {
    query.where('charter_bookings.user_id', user_id);
  }

  return query;
};

const updateStatus = async (id, status, extraFields = {}) => {
  const [updated] = await db('charter_bookings')
    .where({ id })
    .update({ status, ...extraFields })
    .returning('*');
  return updated;
};

const getById = async (id) => {
  return db('charter_bookings').where({ id }).first();
};

// Mengunggah bukti pembayaran charter
const uploadPaymentProof = async (charter_id, user_id, file_url) => {
  const [updated] = await db('charter_bookings')
    .where({ id: charter_id, user_id })
    .whereIn('status', ['menunggu_pembayaran', 'menunggu_konfirmasi'])
    .update({
      payment_proof_url: file_url,
      payment_method: 'cashless',
      status: 'menunggu_konfirmasi' // Kembali ke konfirmasi admin setelah bukti diunggah
    })
    .returning('*');
  
  return updated;
};

module.exports = {
  createRequest,
  getHistory,
  updateStatus,
  getById,
  uploadPaymentProof
};
