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

    // Jika customer, batasi data hanya milik sendiri dan jangan tampilkan yang disembunyikan
    if (role === 'customer') {
      query.where('charter_bookings.user_id', user_id).andWhere('charter_bookings.is_hidden', false);
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

const updatePaymentMethod = async (charter_id, user_id, payment_method) => {
    const updateData = { payment_method };
    if (payment_method === 'cash') {
      updateData.status = 'menunggu_konfirmasi';
    }

  const [updated] = await db('charter_bookings')
    .where({ id: charter_id, user_id })
    .whereIn('status', ['menunggu_pembayaran'])
    .update(updateData)
    .returning('*');
  
  return updated;
};

const cancelBooking = async (booking_id, user_id) => {
  const booking = await db('charter_bookings')
    .where({ id: booking_id, user_id })
    .first();

  if (!booking) return null;

  if (!['selesai', 'COMPLETED', 'APPROVED', 'menunggu_pembayaran', 'menunggu_konfirmasi', 'dibayar'].includes(booking.status)) {
    return null; 
  }

  if (['selesai', 'COMPLETED', 'APPROVED', 'dibayar'].includes(booking.status)) {
    const departureTime = new Date(booking.date_start);
    const deadline = new Date(departureTime);
    deadline.setHours(12, 0, 0, 0); 
    
    const now = new Date();
    if (now > deadline) {
      const error = new Error('Pembatalan pesanan charter hanya dapat dilakukan sebelum pukul 12 Siang pada tanggal keberangkatan');
      error.code = 'CANCELLATION_TIMEOUT';
      throw error;
    }
  }

  const [deleted] = await db('charter_bookings')
    .where({ id: booking_id, user_id })
    .update({ status: 'dibatalkan', fleet_id: null })
    .returning('*');
    
  return deleted;
};

const deleteBooking = async (booking_id, user_id) => {
  const updatedRows = await db('charter_bookings')
    .where({ id: booking_id, user_id })
    .whereIn('status', ['selesai_final', 'dibatalkan', 'ditolak'])
    .update({ is_hidden: true });
    
  return updatedRows > 0;
};

module.exports = {
  createRequest,
  getHistory,
  updateStatus,
  getById,
  uploadPaymentProof,
  updatePaymentMethod,
  cancelBooking,
  deleteBooking
};
