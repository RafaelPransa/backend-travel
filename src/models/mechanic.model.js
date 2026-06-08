const db = require('../config/db');

/**
 * Mendapatkan semua daftar armada/mobil.
 */
const getFleets = async () => {
  return db('fleets').select('*').orderBy('plate_number', 'asc');
};

/**
 * Mengubah status keaktifan armada (active / maintenance).
 */
const updateFleetStatus = async (id, status) => {
  const [updated] = await db('fleets')
    .where({ id })
    .update({ status })
    .returning('*');
  return updated;
};

/**
 * Mendapatkan seluruh log riwayat perawatan (servis) kendaraan.
 */
const getMaintenanceLogs = async () => {
  return db('maintenance_logs')
    .join('fleets', 'maintenance_logs.fleet_id', 'fleets.id')
    .leftJoin('users', 'maintenance_logs.mechanic_id', 'users.id')
    .select(
      'maintenance_logs.id',
      'maintenance_logs.service_date',
      'maintenance_logs.description',
      'maintenance_logs.cost',
      'maintenance_logs.created_at',
      'fleets.plate_number',
      'fleets.car_type',
      'users.name as mechanic_name'
    )
    .orderBy('maintenance_logs.service_date', 'desc');
};

/**
 * Membuat catatan perawatan baru dan secara otomatis mencatat pengeluaran di kas keluar (cashflow).
 * Menggunakan Knex Transaction untuk menjamin integritas data (ACID).
 */
const createMaintenanceLog = async (mechanicId, { fleet_id, service_date, description, cost }) => {
  return db.transaction(async (trx) => {
    // 1. Simpan catatan ke maintenance_logs
    const [log] = await trx('maintenance_logs')
      .insert({
        fleet_id,
        mechanic_id: mechanicId,
        service_date,
        description,
        cost
      })
      .returning('*');

    // 2. Ambil detail plat nomor armada untuk deskripsi cashflow
    const fleet = await trx('fleets').where({ id: fleet_id }).first();
    const plateNumber = fleet ? fleet.plate_number : 'Tidak Diketahui';
    const carType = fleet ? fleet.car_type : 'Armada';

    // 3. Simpan transaksi pengeluaran ke cashflows (category: 'service')
    await trx('cashflows').insert({
      amount: cost,
      type: 'expense',
      category: 'service',
      description: `Biaya servis armada ${carType} [${plateNumber}]: ${description}`,
      reference_id: log.id
    });

    return log;
  });
};

module.exports = {
  getFleets,
  updateFleetStatus,
  getMaintenanceLogs,
  createMaintenanceLog
};
