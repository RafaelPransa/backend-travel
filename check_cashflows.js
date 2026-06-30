const db = require('./src/config/db');

async function check() {
  const data = await db('cashflows')
      .select(
        'cashflows.*',
        db.raw(`
          COALESCE(
            (SELECT payment_method::text FROM travel_bookings WHERE id = cashflows.reference_id AND cashflows.category = 'travel_ticket'),
            (SELECT payment_method::text FROM charter_bookings WHERE id = cashflows.reference_id AND cashflows.category = 'charter_booking'),
            (SELECT payment_method::text FROM package_shipments WHERE id = cashflows.reference_id AND cashflows.category = 'package_shipment'),
            '-'
          ) as payment_method
        `)
      )
      .orderBy('created_at', 'desc').limit(20);
  console.log(JSON.stringify(data, null, 2));
  process.exit(0);
}
check();
