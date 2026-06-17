/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Refactor travel_bookings
  // Drop constraint first to avoid violation during data migration
  await knex.raw("ALTER TABLE travel_bookings DROP CONSTRAINT IF EXISTS travel_bookings_booking_status_check");
  
  // Ubah default value
  await knex.raw("ALTER TABLE travel_bookings ALTER COLUMN booking_status SET DEFAULT 'menunggu_konfirmasi'");
  
  // Migrate data
  await knex('travel_bookings').where('booking_status', 'pending').update({ booking_status: 'menunggu_pembayaran' });
  await knex('travel_bookings').where('booking_status', 'locked').update({ booking_status: 'menunggu_konfirmasi' });
  await knex('travel_bookings').whereIn('booking_status', ['paid', 'prepaid']).update({ booking_status: 'selesai' });
  await knex('travel_bookings').where('booking_status', 'cancelled').update({ booking_status: 'dibatalkan' });
  
  // Add new constraint
  await knex.raw("ALTER TABLE travel_bookings ADD CONSTRAINT travel_bookings_booking_status_check CHECK (booking_status IN ('menunggu_konfirmasi', 'menunggu_pembayaran', 'selesai', 'dibatalkan', 'ditolak'))");

  // 2. Refactor charter_bookings
  // Drop constraint first to avoid violation during data migration
  await knex.raw("ALTER TABLE charter_bookings DROP CONSTRAINT IF EXISTS charter_bookings_status_check");
  
  // Ubah default value
  await knex.raw("ALTER TABLE charter_bookings ALTER COLUMN status SET DEFAULT 'menunggu_konfirmasi'");
  
  // Migrate data
  await knex('charter_bookings').where('status', 'pending').update({ status: 'menunggu_konfirmasi' });
  await knex('charter_bookings').where('status', 'priced_offered').update({ status: 'menunggu_pembayaran' });
  await knex('charter_bookings').whereIn('status', ['paid', 'completed']).update({ status: 'selesai' });
  await knex('charter_bookings').where('status', 'rejected').update({ status: 'ditolak' });
  
  // Add new constraint
  await knex.raw("ALTER TABLE charter_bookings ADD CONSTRAINT charter_bookings_status_check CHECK (status IN ('menunggu_konfirmasi', 'menunggu_pembayaran', 'selesai', 'dibatalkan', 'ditolak'))");

  // 3. Refactor package_shipments (Tambah kolom transaction_status)
  await knex.schema.alterTable('package_shipments', (table) => {
    table.string('transaction_status', 20).defaultTo('menunggu_konfirmasi');
  });
  await knex.raw("ALTER TABLE package_shipments ADD CONSTRAINT package_shipments_transaction_status_check CHECK (transaction_status IN ('menunggu_konfirmasi', 'menunggu_pembayaran', 'selesai', 'dibatalkan', 'ditolak'))");
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // 1. Rollback package_shipments
  await knex.raw("ALTER TABLE package_shipments DROP CONSTRAINT IF EXISTS package_shipments_transaction_status_check");
  await knex.schema.alterTable('package_shipments', (table) => {
    table.dropColumn('transaction_status');
  });

  // 2. Rollback charter_bookings
  await knex.raw("ALTER TABLE charter_bookings ALTER COLUMN status SET DEFAULT 'pending'");
  await knex.raw("ALTER TABLE charter_bookings DROP CONSTRAINT IF EXISTS charter_bookings_status_check");
  await knex.raw("ALTER TABLE charter_bookings ADD CONSTRAINT charter_bookings_status_check CHECK (status IN ('pending', 'priced_offered', 'paid', 'completed', 'rejected'))");
  
  // Kembalikan data lama charter_bookings
  await knex('charter_bookings').where('status', 'menunggu_konfirmasi').update({ status: 'pending' });
  await knex('charter_bookings').where('status', 'menunggu_pembayaran').update({ status: 'priced_offered' });
  await knex('charter_bookings').where('status', 'selesai').update({ status: 'completed' });
  await knex('charter_bookings').where('status', 'ditolak').update({ status: 'rejected' });

  // 3. Rollback travel_bookings
  await knex.raw("ALTER TABLE travel_bookings ALTER COLUMN booking_status SET DEFAULT 'pending'");
  await knex.raw("ALTER TABLE travel_bookings DROP CONSTRAINT IF EXISTS travel_bookings_booking_status_check");
  await knex.raw("ALTER TABLE travel_bookings ADD CONSTRAINT travel_bookings_booking_status_check CHECK (booking_status IN ('pending', 'locked', 'paid', 'prepaid', 'cancelled'))");

  // Kembalikan data lama travel_bookings
  await knex('travel_bookings').where('booking_status', 'menunggu_pembayaran').update({ booking_status: 'pending' });
  await knex('travel_bookings').where('booking_status', 'menunggu_konfirmasi').update({ booking_status: 'locked' });
  await knex('travel_bookings').where('booking_status', 'selesai').update({ booking_status: 'paid' });
  await knex('travel_bookings').where('booking_status', 'dibatalkan').update({ booking_status: 'cancelled' });
};
