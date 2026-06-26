const db = require('../config/db');

/**
 * Format tanggal menjadi string YYYY-MM-DD
 */
const formatDateString = (val) => {
  if (!val) return '';
  const d = new Date(val);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Mengambil daftar tugas aktif hari ini (jadwal regular + charter pariwisata).
 * Menggunakan teknik batch-fetch untuk menghindari masalah N+1 Query.
 */
const getActiveDutiesList = async () => {
  // 1. Ambil jadwal reguler hari ini yang aktif
  const activeSchedules = await db('schedules')
    .join('routes', 'schedules.route_id', 'routes.id')
    .leftJoin('fleets', 'schedules.fleet_id', 'fleets.id')
    .leftJoin('users as driver1', 'schedules.driver_id', 'driver1.id')
    .leftJoin('users as driver_cadangan', 'schedules.driver_2_id', 'driver_cadangan.id')
    .select(
      'schedules.id',
      'schedules.departure_time',
      'schedules.status',
      'schedules.route_id',
      'routes.origin',
      'routes.destination',
      'fleets.plate_number',
      'fleets.car_type',
      'driver1.name as driver_name',
      'driver_cadangan.name as driver_2_name'
    )
    .whereRaw("DATE(schedules.departure_time::timestamptz AT TIME ZONE 'Asia/Jakarta') = CURRENT_DATE")
    .whereNot('schedules.status', 'cancelled')
    .orderBy('schedules.departure_time', 'asc');

  // 2. Ambil sewa pariwisata (charter) hari ini yang berstatus selesai/paid
  const activeCharters = await db('charter_bookings')
    .join('users', 'charter_bookings.user_id', 'users.id')
    .leftJoin('users as driver', 'charter_bookings.driver_id', 'driver.id')
    .leftJoin('fleets', 'charter_bookings.fleet_id', 'fleets.id')
    .select(
      'charter_bookings.id',
      'charter_bookings.car_type as booking_car_type',
      'charter_bookings.destination',
      'charter_bookings.departure_date',
      'charter_bookings.return_date',
      'charter_bookings.pickup_address',
      'charter_bookings.offered_price',
      'users.name as customer_name',
      'users.phone_number as customer_phone',
      'driver.name as driver_name',
      'fleets.plate_number',
      'fleets.car_type as fleet_car_type'
    )
    .where('charter_bookings.status', 'selesai')
    .whereRaw("CURRENT_DATE >= charter_bookings.departure_date AND CURRENT_DATE <= charter_bookings.return_date")
    .orderBy('charter_bookings.departure_date', 'asc');

  const allDuties = [];

  // ========================================================================
  // BATCH-FETCH: Ambil semua statistik sekaligus (menghindari N+1 query)
  // ========================================================================
  if (activeSchedules.length > 0) {
    const scheduleIds = activeSchedules.map(s => s.id);
    const routeIds = [...new Set(activeSchedules.map(s => s.route_id))];

    // Batch 1: Hitung jumlah penumpang per jadwal
    const passengerCounts = await db('travel_bookings')
      .whereIn('schedule_id', scheduleIds)
      .where('booking_status', 'selesai')
      .select('schedule_id')
      .count('id as total')
      .groupBy('schedule_id');

    const passengerMap = {};
    passengerCounts.forEach(r => { passengerMap[r.schedule_id] = parseInt(r.total || 0, 10); });

    // Batch 2: Hitung jumlah paket per rute hari ini
    const packageCounts = await db('package_shipments')
      .whereIn('route_id', routeIds)
      .whereRaw("DATE(created_at::timestamptz AT TIME ZONE 'Asia/Jakarta') = CURRENT_DATE")
      .whereNot('status', 'delivered')
      .select('route_id')
      .count('id as total')
      .groupBy('route_id');

    const packageMap = {};
    packageCounts.forEach(r => { packageMap[r.route_id] = parseInt(r.total || 0, 10); });

    // Batch 3: Total pendapatan tiket per jadwal
    const ticketRevenues = await db('travel_bookings')
      .whereIn('schedule_id', scheduleIds)
      .where('booking_status', 'selesai')
      .select('schedule_id')
      .sum('price as total')
      .groupBy('schedule_id');

    const ticketRevenueMap = {};
    ticketRevenues.forEach(r => { ticketRevenueMap[r.schedule_id] = parseFloat(r.total || 0); });

    // Batch 4: Total pendapatan paket per rute hari ini
    const packageRevenues = await db('package_shipments')
      .whereIn('route_id', routeIds)
      .whereRaw("DATE(created_at::timestamptz AT TIME ZONE 'Asia/Jakarta') = CURRENT_DATE")
      .select('route_id')
      .sum('total_price as total')
      .groupBy('route_id');

    const packageRevenueMap = {};
    packageRevenues.forEach(r => { packageRevenueMap[r.route_id] = parseFloat(r.total || 0); });

    // Gabungkan data dari lookup maps (O(1) per schedule, bukan O(n) query)
    for (const s of activeSchedules) {
      const passengersCount = passengerMap[s.id] || 0;
      const packagesCount = packageMap[s.route_id] || 0;
      const ticketRevenue = ticketRevenueMap[s.id] || 0;
      const packageRevenue = packageRevenueMap[s.route_id] || 0;
      const estimated_revenue = ticketRevenue + packageRevenue;

      allDuties.push({
        id: s.id,
        type: 'rute',
        badge_label: 'RUTE',
        title: s.car_type || 'Travel',
        fleet_code: s.plate_number || 'Belum Di-assign',
        route: `${s.origin} - ${s.destination}`,
        total_passengers: passengersCount,
        total_packages: packagesCount,
        drivers: s.driver_2_name ? [s.driver_name, s.driver_2_name].filter(Boolean) : (s.driver_name ? [s.driver_name] : []),
        estimated_revenue,
        departure_time: new Date(s.departure_time)
      });
    }
  }

  // Proses charter pariwisata (tidak perlu batch — sudah flat data)
  for (const c of activeCharters) {
    allDuties.push({
      id: c.id,
      type: 'booking',
      badge_label: 'BOOKING',
      title: c.fleet_car_type || c.booking_car_type || 'Charter',
      fleet_code: c.plate_number || 'Belum Di-assign',
      customer_name: c.customer_name,
      customer_phone: c.customer_phone,
      pickup_address: c.pickup_address,
      destination: c.destination,
      pickup_date: formatDateString(c.departure_date),
      return_date: formatDateString(c.return_date),
      drivers: c.driver_name ? [c.driver_name] : [],
      estimated_revenue: parseFloat(c.offered_price || 0),
      departure_time: new Date(c.departure_date)
    });
  }

  // Urutkan berdasarkan departure_time terdekat (ascending)
  allDuties.sort((a, b) => a.departure_time - b.departure_time);

  return allDuties;
};

/**
 * Mengambil seluruh metrik ringkasan untuk dashboard admin.
 */
const getDashboardData = async () => {
  // 1. Total pendapatan hari ini
  const todayRevenueResult = await db('cashflows')
    .where('type', 'income')
    .whereRaw("DATE(created_at::timestamptz AT TIME ZONE 'Asia/Jakarta') = CURRENT_DATE")
    .sum('amount as total');
  const today_revenue = parseFloat(todayRevenueResult[0].total || 0);

  // 2. Jumlah pengguna terdaftar (customer)
  const registeredUsersResult = await db('users')
    .where('role', 'customer')
    .count('id as total');
  const registered_users = parseInt(registeredUsersResult[0].total || 0, 10);

  // 3. Total supir aktif
  const activeDriversResult = await db('users')
    .where('role', 'driver')
    .count('id as total');
  const active_drivers = parseInt(activeDriversResult[0].total || 0, 10);

  // 4. Volume pesanan hari ini (travel + charter + package)
  const travelToday = await db('travel_bookings')
    .whereRaw("DATE(created_at::timestamptz AT TIME ZONE 'Asia/Jakarta') = CURRENT_DATE")
    .count('id as total');
  const charterToday = await db('charter_bookings')
    .whereRaw("DATE(created_at::timestamptz AT TIME ZONE 'Asia/Jakarta') = CURRENT_DATE")
    .count('id as total');
  const packageToday = await db('package_shipments')
    .whereRaw("DATE(created_at::timestamptz AT TIME ZONE 'Asia/Jakarta') = CURRENT_DATE")
    .count('id as total');

  const orders_today = parseInt(travelToday[0].total || 0, 10) +
                       parseInt(charterToday[0].total || 0, 10) +
                       parseInt(packageToday[0].total || 0, 10);

  // 5. Volume pesanan bulan ini
  const travelMonth = await db('travel_bookings')
    .whereRaw("DATE_TRUNC('month', created_at::timestamptz AT TIME ZONE 'Asia/Jakarta') = DATE_TRUNC('month', CURRENT_DATE)")
    .count('id as total');
  const charterMonth = await db('charter_bookings')
    .whereRaw("DATE_TRUNC('month', created_at::timestamptz AT TIME ZONE 'Asia/Jakarta') = DATE_TRUNC('month', CURRENT_DATE)")
    .count('id as total');
  const packageMonth = await db('package_shipments')
    .whereRaw("DATE_TRUNC('month', created_at::timestamptz AT TIME ZONE 'Asia/Jakarta') = DATE_TRUNC('month', CURRENT_DATE)")
    .count('id as total');

  const orders_this_month = parseInt(travelMonth[0].total || 0, 10) +
                            parseInt(charterMonth[0].total || 0, 10) +
                            parseInt(packageMonth[0].total || 0, 10);

  return {
    today_revenue,
    total_users: registered_users,
    total_drivers: active_drivers,
    total_bookings_today: orders_today,
    orders_this_month
  };
};

const getRecentBookings = async () => {
  const travelBooking = await db('travel_bookings')
    .leftJoin('users', 'travel_bookings.user_id', 'users.id')
    .leftJoin('schedules', 'travel_bookings.schedule_id', 'schedules.id')
    .leftJoin('routes', 'schedules.route_id', 'routes.id')
    .select(
      'travel_bookings.id',
      'users.name as customer_name',
      'travel_bookings.seat_number',
      'travel_bookings.price',
      'routes.origin as route_origin',
      'routes.destination as route_destination'
    )
    .orderBy('travel_bookings.created_at', 'desc')
    .first();

  const charterBooking = await db('charter_bookings')
    .leftJoin('users', 'charter_bookings.user_id', 'users.id')
    .select(
      'charter_bookings.id',
      'users.name as customer_name',
      'charter_bookings.car_type',
      db.raw('COALESCE(charter_bookings.offered_price, charter_bookings.original_price, 0) as total_price'),
      'charter_bookings.destination'
    )
    .orderBy('charter_bookings.created_at', 'desc')
    .first();

  return {
    travel: travelBooking || null,
    charter: charterBooking || null
  };
};

module.exports = {
  getActiveDutiesList,
  getDashboardData,
  getRecentBookings
};
