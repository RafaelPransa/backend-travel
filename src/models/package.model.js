const db = require('../config/db');

const createShipment = async (data) => {
  const [shipment] = await db('package_shipments').insert(data).returning('*');
  return shipment;
};

const findByWaybill = async (waybill_number) => {
  return db('package_shipments').where({ waybill_number }).first();
};

const updateStatus = async (id, status, proof_of_delivery_url = null) => {
  const updateData = { status };
  if (proof_of_delivery_url) {
    updateData.proof_of_delivery_url = proof_of_delivery_url;
  }
  const [updated] = await db('package_shipments')
    .where({ id })
    .update(updateData)
    .returning('*');
  return updated;
};

const getPackageHistory = async (user_id) => {
  const packages = await db('package_shipments')
    .where('user_id', user_id)
    .where('is_hidden', false)
    .orderBy('created_at', 'desc');

  for (let pkg of packages) {
    if (pkg.fleet_id) {
      const schedule = await db('schedules')
        .where('fleet_id', pkg.fleet_id)
        .whereRaw('DATE(departure_time) >= DATE(?)', [pkg.created_at])
        .orderBy('departure_time', 'asc')
        .first();
      pkg.schedule_status = schedule ? schedule.status : null;
    } else {
      pkg.schedule_status = null;
    }
  }

  return packages;
};

const cancelBooking = async (booking_id, user_id) => {
  const shipment = await db('package_shipments')
    .select('status', 'created_at')
    .where('id', booking_id)
    .andWhere('user_id', user_id)
    .first();

  if (!shipment) return null;

  if (!['selesai', 'COMPLETED', 'APPROVED', 'menunggu_pembayaran', 'pending', 'menunggu_konfirmasi', 'menunggu_harga'].includes(shipment.status)) {
    return null;
  }

  if (['selesai', 'COMPLETED', 'APPROVED'].includes(shipment.status)) {
    const creationDate = new Date(shipment.created_at);
    const deadline = new Date(creationDate);
    deadline.setHours(12, 0, 0, 0); 
    
    const now = new Date();
    if (now > deadline) {
      const error = new Error('Pembatalan pesanan hanya dapat dilakukan sebelum pukul 12 Siang pada tanggal pemesanan');
      error.code = 'CANCELLATION_TIMEOUT';
      throw error;
    }
  }

  const [deleted] = await db('package_shipments')
    .where({ id: booking_id, user_id })
    .del()
    .returning('*');
    
  return deleted;
};

const deleteBooking = async (booking_id, user_id) => {
  const updatedRows = await db('package_shipments')
    .where({ id: booking_id, user_id })
    .whereIn('status', ['dibatalkan', 'ditolak', 'REJECTED'])
    .update({ is_hidden: true });
  return updatedRows > 0;
};

const updatePaymentMethod = async (shipment_id, user_id, payment_method) => {
      const updateData = { payment_method };
      if (payment_method === 'cash') {
        updateData.transaction_status = 'menunggu_konfirmasi'; 
      }
  
    const [updated] = await db('package_shipments')
      .where({ id: shipment_id, user_id })
      .whereIn('transaction_status', ['menunggu_pembayaran'])
      .update(updateData)
      .returning('*');
    
    return updated;
  };

const uploadPaymentProof = async (shipment_id, user_id, file_url) => {
  const [updated] = await db('package_shipments')
    .where({ id: shipment_id, user_id })
    .whereIn('transaction_status', ['menunggu_pembayaran', 'menunggu_konfirmasi']) 
    .update({
      payment_proof_url: file_url,
      payment_method: 'cashless',
      transaction_status: 'menunggu_konfirmasi'
    })
    .returning('*');
  return updated;
};

module.exports = {
  createShipment,
  findByWaybill,
  updateStatus,
  getPackageHistory,
  cancelBooking,
  deleteBooking,
  updatePaymentMethod,
  uploadPaymentProof
};
