/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return Promise.all([
    knex.schema.alterTable('package_shipments', function(table) {
      table.timestamp('locked_until').nullable();
    }),
    knex.schema.alterTable('charter_bookings', function(table) {
      table.timestamp('locked_until').nullable();
    })
  ]);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return Promise.all([
    knex.schema.alterTable('package_shipments', function(table) {
      table.dropColumn('locked_until');
    }),
    knex.schema.alterTable('charter_bookings', function(table) {
      table.dropColumn('locked_until');
    })
  ]);
};
