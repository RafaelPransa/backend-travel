/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function (knex) {
  // Update charter_bookings constraint
  await knex.raw("ALTER TABLE charter_bookings DROP CONSTRAINT IF EXISTS charter_bookings_status_check");
  await knex.raw("ALTER TABLE charter_bookings ADD CONSTRAINT charter_bookings_status_check CHECK (status IN ('menunggu_konfirmasi', 'menunggu_pembayaran', 'dibayar', 'disetujui', 'menunggu_penjemputan', 'dalam_penjemputan', 'on_going', 'selesai', 'dibatalkan', 'ditolak'))");
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function (knex) {
  await knex.raw("ALTER TABLE charter_bookings DROP CONSTRAINT IF EXISTS charter_bookings_status_check");
  await knex.raw("ALTER TABLE charter_bookings ADD CONSTRAINT charter_bookings_status_check CHECK (status IN ('menunggu_konfirmasi', 'menunggu_pembayaran', 'dalam_penjemputan', 'selesai', 'dibatalkan', 'ditolak'))");
};
