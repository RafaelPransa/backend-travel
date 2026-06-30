/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.alterTable('travel_bookings', table => {
    table.boolean('is_hidden').defaultTo(false);
  });
  await knex.schema.alterTable('charter_bookings', table => {
    table.boolean('is_hidden').defaultTo(false);
  });
  await knex.schema.alterTable('package_shipments', table => {
    table.boolean('is_hidden').defaultTo(false);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable('travel_bookings', table => {
    table.dropColumn('is_hidden');
  });
  await knex.schema.alterTable('charter_bookings', table => {
    table.dropColumn('is_hidden');
  });
  await knex.schema.alterTable('package_shipments', table => {
    table.dropColumn('is_hidden');
  });
};
