const db = require('../config/db');

const formatDateString = (val) => {
  if (!val) return '';
  const d = new Date(val);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const fetchActiveDutiesList = async () => {
  // 1. Ambil jadwal reguler hari ini yang aktif (scheduled, board, driving) atau completed
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

  // Proses schedules regular travel
  for (const s of activeSchedules) {
    const [passengersCountResult] = await db('travel_bookings')
      .where('schedule_id', s.id)
      .where('booking_status', 'selesai')
      .count('id as total');
    const passengersCount = parseInt(passengersCountResult.total || 0, 10);

    const [packagesCountResult] = await db('package_shipments')
      .where('route_id', s.route_id)
      .whereRaw("DATE(created_at::timestamptz AT TIME ZONE 'Asia/Jakarta') = CURRENT_DATE")
      .whereNot('status', 'delivered')
      .count('id as total');
    const packagesCount = parseInt(packagesCountResult.total || 0, 10);

    const [ticketRevenueResult] = await db('travel_bookings')
      .where('schedule_id', s.id)
      .where('booking_status', 'selesai')
      .sum('price as total');
    const ticketRevenue = parseFloat(ticketRevenueResult.total || 0);

    const [packageRevenueResult] = await db('package_shipments')
      .where('route_id', s.route_id)
      .whereRaw("DATE(created_at::timestamptz AT TIME ZONE 'Asia/Jakarta') = CURRENT_DATE")
      .sum('total_price as total');
    const packageRevenue = parseFloat(packageRevenueResult.total || 0);

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

  // Proses charter pariwisata
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

const getDashboardMetrics = async (req, res) => {
  try {
    // 1. Total pendapatan hari ini (today's revenue)
    const todayRevenueResult = await db('cashflows')
      .where('type', 'income')
      .whereRaw("DATE(created_at::timestamptz AT TIME ZONE 'Asia/Jakarta') = CURRENT_DATE")
      .sum('amount as total');
    const today_revenue = parseFloat(todayRevenueResult[0].total || 0);

    // 2. Jumlah pengguna terdaftar (registered users count)
    const registeredUsersResult = await db('users')
      .where('role', 'customer')
      .count('id as total');
    const registered_users = parseInt(registeredUsersResult[0].total || 0, 10);

    // 3. Total supir aktif (active drivers count)
    const activeDriversResult = await db('users')
      .where('role', 'driver')
      .count('id as total');
    const active_drivers = parseInt(activeDriversResult[0].total || 0, 10);

    // 4. Volume pesanan hari ini (travel + charter + package created today)
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

    // Volume pesanan bulan ini (travel + charter + package created this month)
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

    // 5. Rincian armada bertugas hari ini (Maksimal 2 teratas untuk dashboard utama)
    const allDuties = await fetchActiveDutiesList();
    const active_duties = allDuties.slice(0, 2);

    return res.status(200).json({
      status: 'success',
      message: 'Berhasil mengambil metrik dasbor utama',
      data: {
        today_revenue,
        registered_users,
        active_drivers,
        orders_today,
        orders_this_month,
        active_duties
      }
    });
  } catch (error) {
    console.error('Error getDashboardMetrics:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil metrik dasbor utama'
    });
  }
};

const getActiveDuties = async (req, res) => {
  try {
    const page = parseInt(req.query.page || 1, 10);
    const limit = parseInt(req.query.limit || 10, 10);
    const offset = (page - 1) * limit;

    const allDuties = await fetchActiveDutiesList();
    const total = allDuties.length;
    const paginatedDuties = allDuties.slice(offset, offset + limit);
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      status: 'success',
      message: 'Berhasil mengambil daftar armada sedang bertugas',
      data: paginatedDuties,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error getActiveDuties:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil daftar armada sedang bertugas'
    });
  }
};

module.exports = {
  getDashboardMetrics,
  getActiveDuties
};
