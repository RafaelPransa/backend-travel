const fs = require('fs');
let c = fs.readFileSync('./src/models/dashboard.model.js', 'utf8');

// Use split/join to avoid regex syntax issues
function replaceAll(str, find, replace) {
  return str.split(find).join(replace);
}

// Fix 1: Timezones
c = replaceAll(c, "= CURRENT_DATE", "= DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')");
c = replaceAll(c, "CURRENT_DATE >=", "DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta') >=");
c = replaceAll(c, "CURRENT_DATE <=", "DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta') <=");

// Fix 2: passengerCounts
c = replaceAll(c, 
  "    const passengerCounts = await db('travel_bookings')\n      .whereIn('schedule_id', scheduleIds)\n      .where('booking_status', 'selesai')",
  "    const passengerCounts = await db('travel_bookings')\n      .whereIn('schedule_id', scheduleIds)\n      .whereIn('booking_status', ['menunggu_penjemputan', 'dalam_penjemputan', 'dalam_perjalanan', 'selesai', 'dibayar'])"
);

// Fix 3: ticketRevenues
c = replaceAll(c,
  "    const ticketRevenues = await db('travel_bookings')\n      .whereIn('schedule_id', scheduleIds)\n      .where('booking_status', 'selesai')",
  "    const ticketRevenues = await db('travel_bookings')\n      .whereIn('schedule_id', scheduleIds)\n      .whereNotIn('booking_status', ['dibatalkan', 'ditolak'])"
);

// Fix 4: original_price
c = replaceAll(c, ".sum('total_price as total')", ".sum('original_price as total')");

// Fix 5: fleet_id in select
c = replaceAll(c,
  ".select(\n      'schedules.id',\n      'schedules.departure_time',",
  ".select(\n      'schedules.id',\n      'schedules.fleet_id',\n      'schedules.departure_time',"
);

// Fix 6: Packages using fleet_id
c = replaceAll(c,
  "const routeIds = [...new Set(activeSchedules.map(s => s.route_id))];",
  "const routeIds = [...new Set(activeSchedules.map(s => s.route_id))];\n    const fleetIds = [...new Set(activeSchedules.map(s => s.fleet_id).filter(Boolean))];"
);

c = replaceAll(c,
  "    const packageCounts = await db('package_shipments')\n      .whereIn('route_id', routeIds)\n      .whereRaw(\"DATE(created_at::timestamptz AT TIME ZONE 'Asia/Jakarta') = DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')\")\n      .whereNot('status', 'delivered')\n      .select('route_id')\n      .count('id as total')\n      .groupBy('route_id');",
  "    const packageCounts = await db('package_shipments')\n      .whereIn('fleet_id', fleetIds)\n      .whereRaw(\"DATE(created_at::timestamptz AT TIME ZONE 'Asia/Jakarta') = DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')\")\n      .whereNot('status', 'delivered')\n      .select('fleet_id')\n      .count('id as total')\n      .groupBy('fleet_id');"
);

c = replaceAll(c,
  "    packageCounts.forEach(r => { packageMap[r.route_id] = parseInt(r.total || 0, 10); });",
  "    packageCounts.forEach(r => { packageMap[r.fleet_id] = parseInt(r.total || 0, 10); });"
);

c = replaceAll(c,
  "    const packageRevenues = await db('package_shipments')\n      .whereIn('route_id', routeIds)\n      .whereRaw(\"DATE(created_at::timestamptz AT TIME ZONE 'Asia/Jakarta') = DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')\")\n      .select('route_id')\n      .sum('original_price as total')\n      .groupBy('route_id');",
  "    const packageRevenues = await db('package_shipments')\n      .whereIn('fleet_id', fleetIds)\n      .whereRaw(\"DATE(created_at::timestamptz AT TIME ZONE 'Asia/Jakarta') = DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')\")\n      .select('fleet_id')\n      .sum('original_price as total')\n      .groupBy('fleet_id');"
);

c = replaceAll(c,
  "    packageRevenues.forEach(r => { packageRevenueMap[r.route_id] = parseFloat(r.total || 0); });",
  "    packageRevenues.forEach(r => { packageRevenueMap[r.fleet_id] = parseFloat(r.total || 0); });"
);

c = replaceAll(c, "const packagesCount = packageMap[s.route_id] || 0;", "const packagesCount = packageMap[s.fleet_id] || 0;");
c = replaceAll(c, "const packageRevenue = packageRevenueMap[s.route_id] || 0;", "const packageRevenue = packageRevenueMap[s.fleet_id] || 0;");


// Fix 7: Active charters
c = replaceAll(c,
  ".whereRaw(\"DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta') >= charter_bookings.departure_date AND DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta') <= charter_bookings.return_date\")",
  `.where(function() {
      this.whereIn('charter_bookings.status', ['dalam_penjemputan', 'on_going'])
          .orWhereRaw("DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta') >= DATE(charter_bookings.departure_date::timestamptz AT TIME ZONE 'Asia/Jakarta') AND DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta') <= DATE(charter_bookings.return_date::timestamptz AT TIME ZONE 'Asia/Jakarta')");
    })`
);

c = replaceAll(c,
  ".where('charter_bookings.status', 'selesai')",
  ".whereIn('charter_bookings.status', ['dalam_penjemputan', 'on_going', 'selesai'])"
);


fs.writeFileSync('./src/models/dashboard.model.js', c);
console.log('Fixed everything successfully!');
