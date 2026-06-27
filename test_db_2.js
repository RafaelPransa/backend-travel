const db = require('./src/config/db');

async function test() {
  try {
    const res = await db('cashflows')
      .select(
        'cashflows.*',
        db.raw(`
          COALESCE(
            (SELECT payment_method FROM travel_bookings WHERE id = cashflows.reference_id AND cashflows.category = 'travel_ticket'),
            (SELECT payment_method FROM charter_bookings WHERE id = cashflows.reference_id AND cashflows.category = 'charter_booking'),
            (SELECT payment_method FROM package_shipments WHERE id = cashflows.reference_id AND cashflows.category = 'package_shipment'),
            '-'
          ) as payment_method
        `)
      )
      .limit(1);
    console.log("Success");
  } catch (e) {
    console.error("Error:", e);
  } finally {
    process.exit(0);
  }
}
test();
