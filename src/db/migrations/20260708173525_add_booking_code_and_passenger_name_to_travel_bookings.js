/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('travel_bookings', (table) => {
    table.string('booking_code', 50).nullable();
    table.string('passenger_name', 100).nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('travel_bookings', (table) => {
    table.dropColumn('booking_code');
    table.dropColumn('passenger_name');
  });
};
