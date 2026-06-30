const db = require('./src/config/db');

async function test() {
  try {
    const cashflows = await db.raw("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'cashflows'");
    console.log("Cashflows schema:");
    console.table(cashflows.rows);

    const travel_bookings = await db.raw("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'travel_bookings'");
    console.log("Travel Bookings schema:");
    console.table(travel_bookings.rows);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
test();
