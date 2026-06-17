/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.config = { transaction: false };

exports.up = async function(knex) {
  // Tambah value 'mechanic' ke type enum user_role secara native di PostgreSQL
  await knex.raw("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'mechanic'");

  // Buat tabel maintenance_logs
  await knex.schema.createTable('maintenance_logs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('fleet_id').references('id').inTable('fleets').onDelete('CASCADE').notNullable();
    table.uuid('driver_id').references('id').inTable('users').onDelete('SET NULL'); // Driver yang melapor
    table.date('service_date').notNullable();
    table.text('description').notNullable();
    table.decimal('cost', 10, 2).notNullable().defaultTo(0.00);
    table.string('proof_image_url', 255); // Kuitansi/bukti foto servis
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    table.check('cost >= 0');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('maintenance_logs');
  // Catatan: Menghapus value enum di PostgreSQL tidak didukung secara langsung via ALTER TYPE.
  // Jadi, enum 'mechanic' dibiarkan tetap ada pada user_role jika rollback.
};
