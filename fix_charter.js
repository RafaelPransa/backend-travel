const fs = require('fs');
let c = fs.readFileSync('./src/models/dashboard.model.js', 'utf8');

c = c.replace(
  /.whereRaw\("DATE\(CURRENT_TIMESTAMP AT TIME ZONE 'Asia\/Jakarta'\) >= charter_bookings.departure_date AND DATE\(CURRENT_TIMESTAMP AT TIME ZONE 'Asia\/Jakarta'\) <= charter_bookings.return_date"\)/g,
  `.where(function() {
        this.whereIn('charter_bookings.status', ['dalam_penjemputan', 'on_going'])
            .orWhereRaw("DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta') >= charter_bookings.departure_date AND DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta') <= charter_bookings.return_date");
      })`
);

fs.writeFileSync('./src/models/dashboard.model.js', c);
console.log('Done!');
