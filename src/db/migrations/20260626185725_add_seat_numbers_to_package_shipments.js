/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.alterTable('package_shipments', (table) => {
    // Array of seat numbers assigned to this package
    table.jsonb('seat_numbers').defaultTo('[]');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable('package_shipments', (table) => {
    table.dropColumn('seat_numbers');
  });
};
