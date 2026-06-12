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
    .orderBy('schedules.departure_time', 'asc');

  if (schedules.length === 0) {
    return schedules;
  }

  // 2. Ambil SEMUA manifest sekaligus dalam 1 query (batch-fetch, bukan N+1)
  const scheduleIds = schedules.map((s) => s.id);

  const allPassengers = await db('travel_bookings')
    .join('users', 'travel_bookings.user_id', 'users.id')
    .select(
      'travel_bookings.schedule_id',
      'travel_bookings.seat_number',
      'users.name as passenger_name',
      'users.phone_number as passenger_phone',
      'travel_bookings.booking_status',
      'travel_bookings.pickup_address',
      'travel_bookings.dropoff_address'
    )
    .whereIn('travel_bookings.schedule_id', scheduleIds)
    .whereIn('travel_bookings.booking_status', ['paid', 'prepaid'])
    .orderBy('travel_bookings.seat_number', 'asc');

  // 3. Kelompokkan penumpang ke jadwal masing-masing secara in-memory
  const passengerMap = {};
  for (const passenger of allPassengers) {
    if (!passengerMap[passenger.schedule_id]) {
      passengerMap[passenger.schedule_id] = [];
    }
    passengerMap[passenger.schedule_id].push({
      seat_number: passenger.seat_number,
      passenger_name: passenger.passenger_name,
      passenger_phone: passenger.passenger_phone,
      booking_status: passenger.booking_status,
      pickup_address: passenger.pickup_address,
      dropoff_address: passenger.dropoff_address
    });
  }

  // 4. Gabungkan ke setiap jadwal
  for (const schedule of schedules) {
    schedule.passengers = passengerMap[schedule.id] || [];
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
      'maintenance_logs.created_at',
      'fleets.plate_number',
      'fleets.car_type',
      'users.name as driver_name'
    )
    .orderBy('maintenance_logs.service_date', 'desc');
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
  getFleets,
  updateFleetStatus,
  getMaintenanceLogs,
  createMaintenanceLog,
  createOperationalExpense,
  getDriverExpenses
};
