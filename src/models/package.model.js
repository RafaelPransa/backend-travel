const db = require('../config/db');

const createShipment = async (data) => {
  const [shipment] = await db('package_shipments').insert(data).returning('*');
  return shipment;
};

const findByWaybill = async (waybill_number) => {
  return db('package_shipments').where({ waybill_number }).first();
};

const updateStatus = async (id, status) => {
  const [updated] = await db('package_shipments')
    .where({ id })
    .update({ status })
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
