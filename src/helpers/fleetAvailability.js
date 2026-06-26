const db = require('../config/db');

/**
 * Mengecek ketersediaan armada pada suatu rentang tanggal.
 * @param {string} carType - Tipe mobil (misal: 'Elf', 'Luxio'). Jika null, tidak difilter.
 * @param {string} departureDate - Tanggal mulai YYYY-MM-DD
 * @param {string} returnDate - Tanggal selesai YYYY-MM-DD
 * @param {string} excludeCharterId - (Opsional) ID charter booking yang akan diabaikan
 * @param {string} excludeScheduleId - (Opsional) ID schedule yang akan diabaikan
 * @returns {Promise<Array>} Array of available fleets
 */
const getAvailableFleets = async (carType, departureDate, returnDate, excludeCharterId = null, excludeScheduleId = null) => {
  // 1. Ambil semua armada aktif (tidak sedang maintenance)
  let fleetsQuery = db('fleets').where('status', 'active');
  if (carType) {
    fleetsQuery = fleetsQuery.where('car_type', carType);
  }
  const activeFleets = await fleetsQuery;

  if (activeFleets.length === 0) return [];

  const fleetIds = activeFleets.map(f => f.id);

  // 2. Ambil armada yang sedang dikunci/digunakan oleh Charter pada rentang tanggal tersebut
  let charterQuery = db('charter_bookings')
    .whereIn('fleet_id', fleetIds)
    .whereIn('status', [
      'menunggu_pembayaran', // Sedang dikunci 10 menit
      'menunggu_konfirmasi', 
      'dibayar', 
      'disetujui', 
      'dalam_penjemputan',
      'selesai'
    ])
    .whereRaw('? <= return_date AND ? >= departure_date', [departureDate, returnDate]);
    
  if (excludeCharterId) {
    charterQuery = charterQuery.whereNot('id', excludeCharterId);
  }
  const activeCharters = await charterQuery;
  
  // Periksa apakah status menunggu_pembayaran sudah kadaluarsa (lock 10 menit)
  const lockedFleetIds = [];
  const now = new Date();
  
  activeCharters.forEach(charter => {
    if (charter.status === 'menunggu_pembayaran') {
      // Kunci 10 menit sejak admin mengatur harga (updated_at)
      const updatedAt = new Date(charter.updated_at || charter.created_at);
      const diffMinutes = (now - updatedAt) / (1000 * 60);
      if (diffMinutes <= 10) {
        lockedFleetIds.push(charter.fleet_id);
      }
    } else {
      lockedFleetIds.push(charter.fleet_id);
    }
  });

  // 3. Ambil armada yang sedang digunakan oleh Rute (Schedule) pada rentang tanggal tersebut
  let scheduleQuery = db('schedules')
    .whereIn('fleet_id', fleetIds)
    .whereNotNull('route_id') // HANYA jadwal travel reguler yang mengunci armada
    .whereRaw('DATE(departure_time) >= ? AND DATE(departure_time) <= ?', [departureDate, returnDate]);
    
  if (excludeScheduleId) {
    scheduleQuery = scheduleQuery.whereNot('id', excludeScheduleId);
  }
  const activeSchedules = await scheduleQuery;
  
  const scheduleFleetIds = activeSchedules.map(s => s.fleet_id);

  // 4. Ambil armada yang sedang digunakan oleh Paket (Package Shipments)
  let packageQuery = db('package_shipments')
    .whereIn('fleet_id', fleetIds)
    .whereIn('status', ['received', 'in_transit', 'menunggu_penjemputan', 'dalam_penjemputan'])
    .whereRaw('departure_date >= ? AND departure_date <= ?', [departureDate, returnDate]);
    
  const activePackages = await packageQuery;
  const packageFleetIds = activePackages.map(p => p.fleet_id);

  // 5. Gabungkan fleet_id yang sedang sibuk
  let busyFleetIds = [...new Set([...lockedFleetIds, ...scheduleFleetIds, ...packageFleetIds])];

  if (excludeScheduleId) {
    const excSched = await db('schedules').where('id', excludeScheduleId).first();
    if (excSched && excSched.fleet_id) {
       busyFleetIds = busyFleetIds.filter(id => id !== excSched.fleet_id);
    }
  }

  // 6. Filter armada yang benar-benar kosong
  const availableFleets = activeFleets.filter(fleet => !busyFleetIds.includes(fleet.id));

  return availableFleets;
};

module.exports = {
  getAvailableFleets
};
