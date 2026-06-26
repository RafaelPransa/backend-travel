const fs = require('fs');
let c = fs.readFileSync('./src/models/dashboard.model.js', 'utf8');

// 1. Timezone
c = c.replace(/=\s*CURRENT_DATE/g, "= DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')");
c = c.replace(/CURRENT_DATE\s*>=/g, "DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta') >=");
c = c.replace(/CURRENT_DATE\s*<=/g, "DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta') <=");

// 2. Select fleet_id in activeSchedules
c = c.replace(
  /'schedules\.id',\s*'schedules\.departure_time',/,
  "'schedules.id',\n      'schedules.fleet_id',\n      'schedules.departure_time',"
);

// 3. Passenger counts & Ticket Revenues status
c = c.replace(
  /\.where\('booking_status',\s*'selesai'\)\s*\.select\('schedule_id'\)/,
  ".whereIn('booking_status', ['menunggu_penjemputan', 'dalam_penjemputan', 'dalam_perjalanan', 'selesai', 'dibayar'])\n      .select('schedule_id')"
);
c = c.replace(
  /\.where\('booking_status',\s*'selesai'\)\s*\.select\('schedule_id'\)/,
  ".whereNotIn('booking_status', ['dibatalkan', 'ditolak'])\n      .select('schedule_id')"
);

// 4. Packages grouping
c = c.replace(
  /const routeIds = \[.*?\];/,
  "const routeIds = [...new Set(activeSchedules.map(s => s.route_id))];\n    const fleetIds = [...new Set(activeSchedules.map(s => s.fleet_id).filter(Boolean))];"
);
c = c.replace(
  /const packageCounts = await db\('package_shipments'\)[\s\S]*?\.whereIn\('route_id',\s*routeIds\)[\s\S]*?\.select\('route_id'\)[\s\S]*?\.groupBy\('route_id'\);/,
  `const packageCounts = await db('package_shipments')
      .whereIn('fleet_id', fleetIds)
      .whereRaw("DATE(created_at::timestamptz AT TIME ZONE 'Asia/Jakarta') = DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')")
      .whereNot('status', 'delivered')
      .select('fleet_id')
      .count('id as total')
      .groupBy('fleet_id');`
);
c = c.replace(/packageMap\[r\.route_id\]/g, "packageMap[r.fleet_id]");
c = c.replace(/packageMap\[s\.route_id\]/g, "packageMap[s.fleet_id]");

c = c.replace(
  /const packageRevenues = await db\('package_shipments'\)[\s\S]*?\.whereIn\('route_id',\s*routeIds\)[\s\S]*?\.select\('route_id'\)[\s\S]*?\.groupBy\('route_id'\);/,
  `const packageRevenues = await db('package_shipments')
      .whereIn('fleet_id', fleetIds)
      .whereRaw("DATE(created_at::timestamptz AT TIME ZONE 'Asia/Jakarta') = DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')")
      .select('fleet_id')
      .sum('original_price as total')
      .groupBy('fleet_id');`
);
c = c.replace(/packageRevenueMap\[r\.route_id\]/g, "packageRevenueMap[r.fleet_id]");
c = c.replace(/packageRevenueMap\[s\.route_id\]/g, "packageRevenueMap[s.fleet_id]");

// 5. Charter bookings filtering
// Replace the exact block for active charters
c = c.replace(
  /\.where\('charter_bookings\.status',\s*'selesai'\)\s*\.whereRaw\(.*?charter_bookings\.return_date"\)/,
  `.where(function() {
      this.whereIn('charter_bookings.status', ['dalam_penjemputan', 'on_going', 'selesai'])
          .orWhereRaw("DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta') >= DATE(charter_bookings.departure_date::timestamptz AT TIME ZONE 'Asia/Jakarta') AND DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta') <= DATE(charter_bookings.return_date::timestamptz AT TIME ZONE 'Asia/Jakarta')");
    })`
);

// Replace remaining original_price in getDashboardData
c = c.replace(/\.sum\('total_price as total'\)/g, ".sum('original_price as total')");

fs.writeFileSync('./src/models/dashboard.model.js', c);
console.log('Patch complete!');
