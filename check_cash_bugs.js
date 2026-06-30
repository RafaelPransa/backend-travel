const db = require('./src/config/db');

async function check() {
  const cashTravel = await db('cashflows')
    .join('travel_bookings', 'cashflows.reference_id', 'travel_bookings.id')
    .select('cashflows.id', 'cashflows.created_at', 'travel_bookings.booking_status', 'travel_bookings.payment_method')
    .where('cashflows.category', 'travel_ticket');
    
  const cashPackage = await db('cashflows')
    .join('package_shipments', 'cashflows.reference_id', 'package_shipments.id')
    .select('cashflows.id', 'cashflows.created_at', 'package_shipments.status as booking_status', 'package_shipments.payment_method')
    .where('cashflows.category', 'package_shipment');
    
  console.log("Travel Bookings logged to cashflows:");
  console.table(cashTravel);
  
  console.log("Package Shipments logged to cashflows:");
  console.table(cashPackage);
  process.exit(0);
}
check();
