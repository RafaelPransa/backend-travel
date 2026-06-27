const fs = require('fs');
let c = fs.readFileSync('./src/models/dashboard.model.js', 'utf8');

c = c.replace(
  "      .whereNotIn('charter_bookings.status', ['selesai', 'selesai_final', 'dibatalkan', 'ditolak'])",
  "      .whereNotIn('charter_bookings.status', ['selesai', 'selesai_final', 'dibatalkan', 'ditolak', 'dalam_penjemputan', 'on_going', 'menunggu_penjemputan', 'disetujui'])"
);

fs.writeFileSync('./src/models/dashboard.model.js', c);
console.log('Fixed recent charter booking filter!');
