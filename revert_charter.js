const fs = require('fs');
let c = fs.readFileSync('./src/models/dashboard.model.js', 'utf8');

c = c.replace(
  /\.where\(function\(\)\s*\{\s*this\.whereIn\('charter_bookings\.status', \['dalam_penjemputan', 'on_going'\]\)\s*\.orWhere\(function\(\)\s*\{\s*this\.where\('charter_bookings\.status', 'selesai'\)\s*\.whereRaw\("DATE\(CURRENT_TIMESTAMP AT TIME ZONE 'Asia\/Jakarta'\) >= DATE\(charter_bookings\.departure_date::timestamptz AT TIME ZONE 'Asia\/Jakarta'\) AND DATE\(CURRENT_TIMESTAMP AT TIME ZONE 'Asia\/Jakarta'\) <= DATE\(charter_bookings\.return_date::timestamptz AT TIME ZONE 'Asia\/Jakarta'\)"\);\s*\}\);\s*\}\)/g,
  `.whereIn('charter_bookings.status', ['dalam_penjemputan', 'on_going', 'selesai'])
    .whereRaw("DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta') >= DATE(charter_bookings.departure_date::timestamptz AT TIME ZONE 'Asia/Jakarta') AND DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta') <= DATE(charter_bookings.return_date::timestamptz AT TIME ZONE 'Asia/Jakarta')")`
);

fs.writeFileSync('./src/models/dashboard.model.js', c);
console.log('Reverted charter logic!');
