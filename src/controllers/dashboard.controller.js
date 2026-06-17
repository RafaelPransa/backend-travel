const db = require('../config/db');

const getDashboardMetrics = async (req, res) => {
  try {
    // 1. Total pendapatan hari ini (today's revenue)
    // Menghitung seluruh kas masuk (income) hari ini dengan penyesuaian zona waktu Asia/Jakarta
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

    // 5. Rincian akumulasi pendapatan dari masing-masing armada
    // Akumulasi total harga tiket untuk travel reguler yang sukses (selesai) per armada
    const fleetRevenues = await db('fleets')
      .leftJoin('schedules', 'schedules.fleet_id', 'fleets.id')
      .leftJoin('travel_bookings', function() {
        this.on('travel_bookings.schedule_id', '=', 'schedules.id')
          .andOnVal('travel_bookings.booking_status', '=', 'selesai');
      })
      .leftJoin('routes', 'schedules.route_id', 'routes.id')
      .select(
        'fleets.plate_number',
        'fleets.car_type'
      )
      .sum('routes.base_price as total')
      .groupBy('fleets.id', 'fleets.plate_number', 'fleets.car_type')
      .orderBy('total', 'desc');

    const fleet_revenues = fleetRevenues.map(f => ({
      plate_number: f.plate_number,
      car_type: f.car_type,
      total_revenue: parseFloat(f.total || 0)
    }));

    return res.status(200).json({
      status: 'success',
      message: 'Berhasil mengambil metrik dasbor utama',
      data: {
        today_revenue,
        registered_users,
        active_drivers,
        orders_today,
        orders_this_month,
        fleet_revenues
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

module.exports = {
  getDashboardMetrics
};
