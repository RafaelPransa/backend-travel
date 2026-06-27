const fs = require('fs');
let c = fs.readFileSync('./src/models/dashboard.model.js', 'utf8');

c = c.split("= CURRENT_DATE").join("= DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')");
c = c.split("CURRENT_DATE >=").join("DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta') >=");
c = c.split("CURRENT_DATE <=").join("DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta') <=");

c = c.split(".where('booking_status', 'selesai')").join(".whereIn('booking_status', ['menunggu_penjemputan', 'dalam_penjemputan', 'dalam_perjalanan', 'selesai', 'dibayar'])");

// The second where('booking_status', 'selesai') is in ticketRevenues, the first was passengerCounts. wait, there are 3. The 3rd is in charter_bookings.
// Let's just fix them individually!
c = fs.readFileSync('./src/models/dashboard.model.js', 'utf8');

// 1. Timezone
c = c.split("= CURRENT_DATE").join("= DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')");
c = c.split("CURRENT_DATE >=").join("DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta') >=");
c = c.split("CURRENT_DATE <=").join("DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta') <=");

// 2. Select fleet_id in activeSchedules
c = c.replace(
  "      'schedules.id',\n      'schedules.departure_time',",
  "      'schedules.id',\n      'schedules.fleet_id',\n      'schedules.departure_time',"
);

// 3. Passenger counts & Ticket Revenues status
c = c.replace(
  "      .where('booking_status', 'selesai')\n      .select('schedule_id')",
  "      .whereIn('booking_status', ['menunggu_penjemputan', 'dalam_penjemputan', 'dalam_perjalanan', 'selesai', 'dibayar'])\n      .select('schedule_id')"
);
c = c.replace(
  "      .where('booking_status', 'selesai')\n      .select('schedule_id')",
  "      .whereNotIn('booking_status', ['dibatalkan', 'ditolak'])\n      .select('schedule_id')"
);

// 4. Packages
c = c.replace(
  "const routeIds = [...new Set(activeSchedules.map(s => s.route_id))];",
  "const routeIds = [...new Set(activeSchedules.map(s => s.route_id))];\n    const fleetIds = [...new Set(activeSchedules.map(s => s.fleet_id).filter(Boolean))];"
);
c = c.replace(
  "      .whereIn('route_id', routeIds)\n      .whereRaw(\"DATE(created_at::timestamptz AT TIME ZONE 'Asia/Jakarta') = DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')\")\n      .whereNot('status', 'delivered')\n      .select('route_id')\n      .count('id as total')\n      .groupBy('route_id');",
  "      .whereIn('fleet_id', fleetIds)\n      .whereRaw(\"DATE(created_at::timestamptz AT TIME ZONE 'Asia/Jakarta') = DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')\")\n      .whereNot('status', 'delivered')\n      .select('fleet_id')\n      .count('id as total')\n      .groupBy('fleet_id');"
);
c = c.replace(
  "packageCounts.forEach(r => { packageMap[r.route_id] = parseInt(r.total || 0, 10); });",
  "packageCounts.forEach(r => { packageMap[r.fleet_id] = parseInt(r.total || 0, 10); });"
);
c = c.replace(
  "      .whereIn('route_id', routeIds)\n      .whereRaw(\"DATE(created_at::timestamptz AT TIME ZONE 'Asia/Jakarta') = DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')\")\n      .select('route_id')\n      .sum('total_price as total')\n      .groupBy('route_id');",
  "      .whereIn('fleet_id', fleetIds)\n      .whereRaw(\"DATE(created_at::timestamptz AT TIME ZONE 'Asia/Jakarta') = DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')\")\n      .select('fleet_id')\n      .sum('original_price as total')\n      .groupBy('fleet_id');"
);
c = c.replace(
  "packageRevenues.forEach(r => { packageRevenueMap[r.route_id] = parseFloat(r.total || 0); });",
  "packageRevenues.forEach(r => { packageRevenueMap[r.fleet_id] = parseFloat(r.total || 0); });"
);
c = c.replace("const packagesCount = packageMap[s.route_id] || 0;", "const packagesCount = packageMap[s.fleet_id] || 0;");
c = c.replace("const packageRevenue = packageRevenueMap[s.route_id] || 0;", "const packageRevenue = packageRevenueMap[s.fleet_id] || 0;");

// 5. Charter bookings
c = c.replace(
  "    .where('charter_bookings.status', 'selesai')\n    .whereRaw(\"DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta') >= charter_bookings.departure_date AND DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta') <= charter_bookings.return_date\")",
  `    .where(function() {
      this.whereIn('charter_bookings.status', ['dalam_penjemputan', 'on_going'])
          .orWhereRaw("DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta') >= DATE(charter_bookings.departure_date::timestamptz AT TIME ZONE 'Asia/Jakarta') AND DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta') <= DATE(charter_bookings.return_date::timestamptz AT TIME ZONE 'Asia/Jakarta')");
    })`
);

fs.writeFileSync('./src/models/dashboard.model.js', c);
console.log('All patches applied correctly!');
