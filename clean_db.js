const db = require('./src/config/db');

async function clean() {
  try {
    const cashflows = await db('cashflows').select('*');
    let deleted = 0;
    
    for (const cf of cashflows) {
      if (cf.category === 'travel_ticket') {
        const tb = await db('travel_bookings').where('id', cf.reference_id).first();
        if (tb && tb.payment_method === 'cash' && tb.booking_status !== 'selesai') {
          await db('cashflows').where('id', cf.id).delete();
          deleted++;
        }
      } else if (cf.category === 'package_shipment') {
        const ps = await db('package_shipments').where('id', cf.reference_id).first();
        if (ps && ps.payment_method === 'cash' && ps.status !== 'selesai' && ps.status !== 'received' && ps.status !== 'delivered') {
          await db('cashflows').where('id', cf.id).delete();
          deleted++;
        }
      } else if (cf.category === 'charter_booking') {
        const cb = await db('charter_bookings').where('id', cf.reference_id).first();
        if (cb && cb.payment_method === 'cash' && cb.status !== 'selesai') {
          await db('cashflows').where('id', cf.id).delete();
          deleted++;
        }
      }
    }
    console.log("Deleted " + deleted + " invalid cashflow records");
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
clean();
