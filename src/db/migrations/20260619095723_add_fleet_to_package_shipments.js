/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.alterTable('package_shipments', (table) => {
    table.uuid('fleet_id').references('id').inTable('fleets').onDelete('SET NULL');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable('package_shipments', (table) => {
    table.dropColumn('fleet_id');
  });
};

