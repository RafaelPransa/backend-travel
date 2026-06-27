const fs = require('fs');
let c = fs.readFileSync('./src/models/dashboard.model.js', 'utf8');

c = c.replace(
  `.where(function() {
      this.whereIn('charter_bookings.status', ['dalam_penjemputan', 'on_going', 'selesai'])
          .orWhereRaw("DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta') >= DATE(charter_bookings.departure_date::timestamptz AT TIME ZONE 'Asia/Jakarta') AND DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta') <= DATE(charter_bookings.return_date::timestamptz AT TIME ZONE 'Asia/Jakarta')");
    })`,
  `.where(function() {
      this.whereIn('charter_bookings.status', ['dalam_penjemputan', 'on_going'])
          .orWhere(function() {
            this.where('charter_bookings.status', 'selesai')
                .whereRaw("DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta') >= DATE(charter_bookings.departure_date::timestamptz AT TIME ZONE 'Asia/Jakarta') AND DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta') <= DATE(charter_bookings.return_date::timestamptz AT TIME ZONE 'Asia/Jakarta')");
          });
    })`
);

fs.writeFileSync('./src/models/dashboard.model.js', c);
console.log('Fixed OR logic!');
