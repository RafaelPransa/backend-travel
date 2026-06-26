/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Drop constraint lama jika ada
  await knex.raw("ALTER TABLE travel_bookings DROP CONSTRAINT IF EXISTS travel_bookings_booking_status_check");
  
  // Tambahkan constraint baru dengan status yang lebih lengkap
  await knex.raw("ALTER TABLE travel_bookings ADD CONSTRAINT travel_bookings_booking_status_check CHECK (booking_status IN ('menunggu_konfirmasi', 'menunggu_pembayaran', 'dibayar', 'dalam_penjemputan', 'dalam_perjalanan', 'selesai', 'dibatalkan', 'ditolak'))");
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.raw("ALTER TABLE travel_bookings DROP CONSTRAINT IF EXISTS travel_bookings_booking_status_check");
  await knex.raw("ALTER TABLE travel_bookings ADD CONSTRAINT travel_bookings_booking_status_check CHECK (booking_status IN ('menunggu_konfirmasi', 'menunggu_pembayaran', 'dalam_penjemputan', 'selesai', 'dibatalkan', 'ditolak'))");
};
