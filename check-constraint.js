const fs = require('fs');
const db = require('./src/config/db');
db.raw("SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'travel_bookings_booking_status_check'")
  .then(res => {
    fs.writeFileSync('constraint.txt', JSON.stringify(res.rows[0]));
    process.exit(0);
  });
