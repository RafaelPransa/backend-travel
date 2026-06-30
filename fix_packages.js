const fs = require('fs');
let c = fs.readFileSync('./src/models/dashboard.model.js', 'utf8');

// Fix 1: Modify packageCounts and packageRevenues to use fleet_id instead of route_id
c = c.replace(/const routeIds = \[\.\.\.new Set\(activeSchedules\.map\(s => s\.route_id\)\)\];/g, 
  "const routeIds = [...new Set(activeSchedules.map(s => s.route_id))];\n      const fleetIds = [...new Set(activeSchedules.map(s => s.fleet_id).filter(Boolean))];");

c = c.replace(/.whereIn\('route_id', routeIds\)/g, ".whereIn('fleet_id', fleetIds)");
c = c.replace(/.select\('route_id'\)/g, ".select('fleet_id')");
c = c.replace(/.groupBy\('route_id'\)/g, ".groupBy('fleet_id')");
c = c.replace(/packageMap\[r\.route_id\]/g, "packageMap[r.fleet_id]");
c = c.replace(/packageRevenueMap\[r\.route_id\]/g, "packageRevenueMap[r.fleet_id]");
c = c.replace(/packageMap\[s\.route_id\]/g, "packageMap[s.fleet_id]");
c = c.replace(/packageRevenueMap\[s\.route_id\]/g, "packageRevenueMap[s.fleet_id]");

// Fix 2: Modify activeCharters to include 'dalam_penjemputan' and 'on_going'
c = c.replace(/.where\('charter_bookings.status', 'selesai'\)/g, ".whereIn('charter_bookings.status', ['dalam_penjemputan', 'on_going', 'selesai'])");

fs.writeFileSync('./src/models/dashboard.model.js', c);
console.log('Fixed successfully!');
