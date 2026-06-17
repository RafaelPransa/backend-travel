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
  return db('package_shipments')
    .select('*')
    .where('user_id', user_id)
    .orderBy('created_at', 'desc');
};

module.exports = {
  createShipment,
  findByWaybill,
  updateStatus,
  getPackageHistory
};
