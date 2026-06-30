/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Update charter_bookings constraint
  await knex.raw("ALTER TABLE charter_bookings DROP CONSTRAINT IF EXISTS charter_bookings_status_check");
  await knex.raw("ALTER TABLE charter_bookings ADD CONSTRAINT charter_bookings_status_check CHECK (status IN ('menunggu_konfirmasi', 'menunggu_pembayaran', 'dalam_penjemputan', 'selesai', 'dibatalkan', 'ditolak'))");

  // Update package_shipments constraint
  await knex.raw("ALTER TABLE package_shipments DROP CONSTRAINT IF EXISTS package_shipments_transaction_status_check");
  await knex.raw("ALTER TABLE package_shipments ADD CONSTRAINT package_shipments_transaction_status_check CHECK (transaction_status IN ('menunggu_konfirmasi', 'menunggu_pembayaran', 'dalam_penjemputan', 'selesai', 'dibatalkan', 'ditolak'))");
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex('charter_bookings').where('status', 'dalam_penjemputan').update({ status: 'menunggu_konfirmasi' });
  await knex.raw("ALTER TABLE charter_bookings DROP CONSTRAINT IF EXISTS charter_bookings_status_check");
  await knex.raw("ALTER TABLE charter_bookings ADD CONSTRAINT charter_bookings_status_check CHECK (status IN ('menunggu_konfirmasi', 'menunggu_pembayaran', 'selesai', 'dibatalkan', 'ditolak'))");

  await knex('package_shipments').where('transaction_status', 'dalam_penjemputan').update({ transaction_status: 'menunggu_konfirmasi' });
  await knex.raw("ALTER TABLE package_shipments DROP CONSTRAINT IF EXISTS package_shipments_transaction_status_check");
  await knex.raw("ALTER TABLE package_shipments ADD CONSTRAINT package_shipments_transaction_status_check CHECK (transaction_status IN ('menunggu_konfirmasi', 'menunggu_pembayaran', 'selesai', 'dibatalkan', 'ditolak'))");
};
