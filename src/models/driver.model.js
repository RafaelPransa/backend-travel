const db = require('../config/db');

/**
 * Mengambil jadwal yang di-assign ke driver beserta manifest penumpang.
 * Menggunakan teknik batch-fetch untuk menghindari masalah N+1 Query.
 */
const getAssignedSchedules = async (driver_id) => {
  // 1. Ambil semua jadwal milik driver ini
  const schedules = await db('schedules')
    .join('routes', 'schedules.route_id', 'routes.id')
    .leftJoin('fleets', 'schedules.fleet_id', 'fleets.id')
    .select(
      'schedules.id',
      'schedules.fleet_id',
      'schedules.departure_time',
      'schedules.status',
      'routes.origin',
      'routes.destination',
      'routes.base_price',
      'fleets.plate_number',
      'fleets.car_type',
      'fleets.seat_capacity'
    )
    .where('schedules.driver_id', driver_id)
    .whereNot('schedules.status', 'completed')
    .orderBy('schedules.departure_time', 'asc');

  if (schedules.length === 0) {
    return schedules;
  }

  // 2. Ambil SEMUA manifest sekaligus dalam 1 query (batch-fetch, bukan N+1)
  const scheduleIds = schedules.map((s) => s.id);

  const allPassengers = await db('travel_bookings')
    .join('users', 'travel_bookings.user_id', 'users.id')
    .select(
      'travel_bookings.id as booking_id',
      'travel_bookings.schedule_id',
      'travel_bookings.seat_number',
      'travel_bookings.price',
      'users.name as passenger_name',
      'users.phone_number as passenger_phone',
      'travel_bookings.booking_status',
      'travel_bookings.payment_method',
      'travel_bookings.pickup_address',
      'travel_bookings.dropoff_address'
    )
    .whereIn('travel_bookings.schedule_id', scheduleIds)
    .whereNotIn('travel_bookings.booking_status', ['dibatalkan', 'ditolak'])
    .orderBy('travel_bookings.seat_number', 'asc');

  // 3. Kelompokkan penumpang ke jadwal masing-masing secara in-memory
  const passengerMap = {};
  for (const passenger of allPassengers) {
    if (!passengerMap[passenger.schedule_id]) {
      passengerMap[passenger.schedule_id] = [];
    }
    passengerMap[passenger.schedule_id].push({
      booking_id: passenger.booking_id,
      seat_number: passenger.seat_number,
      passenger_name: passenger.passenger_name,
      passenger_phone: passenger.passenger_phone,
      booking_status: passenger.booking_status,
      payment_method: passenger.payment_method,
      price: passenger.price,
      pickup_address: passenger.pickup_address,
      dropoff_address: passenger.dropoff_address
    });
  }

  // 4. Ambil semua paket untuk armada-armada ini pada tanggal tersebut
  // Kita ambil ID armada yang terhubung dengan jadwal
  const validFleetIds = schedules.filter(s => s.fleet_id).map(s => s.fleet_id);
  let allPackages = [];
  
  if (validFleetIds.length > 0) {
    allPackages = await db('package_shipments')
      .select(
        'id as package_id',
        'fleet_id',
        'waybill_number',
        'sender_name',
        'sender_phone',
        'receiver_name',
        'receiver_phone',
        'receiver_address',
        'package_description',
        'weight',
        'dimension',
        'original_price',
        'payment_method',
        'transaction_status',
        'status',
        'created_at'
      )
      .whereIn('fleet_id', validFleetIds)
      .whereNotIn('status', ['dibatalkan', 'ditolak', 'REJECTED']);
  }

  // 5. Gabungkan ke setiap jadwal
  for (const schedule of schedules) {
    schedule.passengers = passengerMap[schedule.id] || [];
    
    // Filter paket berdasarkan fleet_id dan tanggal yang sama
    if (schedule.fleet_id && schedule.departure_time) {
      const depDate = new Date(schedule.departure_time).toISOString().split('T')[0];
      schedule.packages = allPackages.filter(p => {
        const pkgDate = new Date(p.created_at).toISOString().split('T')[0];
        return p.fleet_id === schedule.fleet_id && pkgDate <= depDate && !['delivered'].includes(p.status);
      });
    } else {
      schedule.packages = [];
    }
  }

  return schedules;
};

const updateScheduleStatus = async (id, driver_id, status) => {
  const [updated] = await db('schedules')
    .where({ id, driver_id }) // Otorisasi internal: Driver hanya bisa update jadwal miliknya
    .update({ status })
    .returning('*');
  return updated;
};

const updateTravelBookingStatus = async (booking_id, driver_id, booking_status) => {
  // Verifikasi bahwa booking ini milik jadwal yang dipegang oleh driver
  const booking = await db('travel_bookings')
    .join('schedules', 'travel_bookings.schedule_id', 'schedules.id')
    .where('travel_bookings.id', booking_id)
    .where('schedules.driver_id', driver_id)
    .select('travel_bookings.id')
    .first();

  if (!booking) {
    return null; // Tidak ditemukan atau bukan haknya
  }

  const [updated] = await db('travel_bookings')
    .where({ id: booking_id })
    .update({ booking_status })
    .returning('*');
    
  return updated;
};

const updatePackageStatus = async (package_id, driver_id, status) => {
  // Verifikasi package ini ditugaskan ke fleet yang dibawa driver ini pada jadwal aktif
  const pkg = await db('package_shipments')
    .join('schedules', 'package_shipments.fleet_id', 'schedules.fleet_id')
    .where('package_shipments.id', package_id)
    .where('schedules.driver_id', driver_id)
    .select('package_shipments.id')
    .first();

  if (!pkg) {
    return null;
  }

  const [updated] = await db('package_shipments')
    .where({ id: package_id })
    .update({ status })
    .returning('*');
    
  return updated;
};

// ============================================================================
// MIGRATED FLEET & MAINTENANCE METHODS (FROM MECHANIC)
// ============================================================================

const getFleets = async () => {
  return db('fleets').select('*').orderBy('plate_number', 'asc');
};

const updateFleetStatus = async (id, status) => {
  const [updated] = await db('fleets')
    .where({ id })
    .update({ status })
    .returning('*');
  return updated;
};

const getMaintenanceLogs = async () => {
  return db('maintenance_logs')
    .join('fleets', 'maintenance_logs.fleet_id', 'fleets.id')
    .leftJoin('users', 'maintenance_logs.driver_id', 'users.id')
    .select(
      'maintenance_logs.id',
      'maintenance_logs.service_date',
      'maintenance_logs.description',
      'maintenance_logs.cost',
      'maintenance_logs.proof_image_url',
      'maintenance_logs.status',
      'maintenance_logs.created_at',
      'fleets.plate_number',
      'fleets.car_type',
      'users.name as driver_name'
    )
    .orderBy('maintenance_logs.service_date', 'desc');
};

const verifyMaintenanceLog = async (id, status) => {
  const [updated] = await db('maintenance_logs')
    .where({ id })
    .update({ status })
    .returning('*');
  return updated;
};

// Catat log servis. Menghindari duplikasi pencatatan cashflow dengan membiarkan trigger DB yang bekerja.
const createMaintenanceLog = async (driverId, { fleet_id, service_date, description, cost, proof_image_url }) => {
  const [log] = await db('maintenance_logs')
    .insert({
      fleet_id,
      driver_id: driverId,
      service_date,
      description,
      cost,
      proof_image_url
    })
    .returning('*');
  return log;
};

// ============================================================================
// OPERATIONAL EXPENSES METHODS
// ============================================================================

const createOperationalExpense = async (data) => {
  const [expense] = await db('operational_expenses')
    .insert(data)
    .returning('*');
  return expense;
};

const getDriverExpenses = async (driver_id) => {
  return db('operational_expenses')
    .join('schedules', 'operational_expenses.schedule_id', 'schedules.id')
    .join('routes', 'schedules.route_id', 'routes.id')
    .select(
      'operational_expenses.*',
      'schedules.departure_time',
      'routes.origin',
      'routes.destination'
    )
    .where('operational_expenses.driver_id', driver_id)
    .orderBy('operational_expenses.created_at', 'desc');
};

module.exports = {
  getAssignedSchedules,
  updateScheduleStatus,
  updateTravelBookingStatus,
  updatePackageStatus,
  
  // Fleet & Maintenance
  getFleets,
  updateFleetStatus,
  getMaintenanceLogs,
  createMaintenanceLog,
  verifyMaintenanceLog,
  createOperationalExpense,
  getDriverExpenses
};
