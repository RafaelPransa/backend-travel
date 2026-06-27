/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.raw("ALTER TABLE travel_bookings DROP CONSTRAINT IF EXISTS travel_bookings_booking_status_check");
  await knex.raw("ALTER TABLE travel_bookings ADD CONSTRAINT travel_bookings_booking_status_check CHECK (booking_status IN ('menunggu_konfirmasi', 'menunggu_pembayaran', 'dalam_penjemputan', 'selesai', 'dibatalkan', 'ditolak'))");
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex('travel_bookings').where('booking_status', 'dalam_penjemputan').update({ booking_status: 'menunggu_konfirmasi' });
  await knex.raw("ALTER TABLE travel_bookings DROP CONSTRAINT IF EXISTS travel_bookings_booking_status_check");
  await knex.raw("ALTER TABLE travel_bookings ADD CONSTRAINT travel_bookings_booking_status_check CHECK (booking_status IN ('menunggu_konfirmasi', 'menunggu_pembayaran', 'selesai', 'dibatalkan', 'ditolak'))");
};
