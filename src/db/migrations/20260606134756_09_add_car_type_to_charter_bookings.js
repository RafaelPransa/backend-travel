exports.up = function(knex) {
  return knex.schema.alterTable('charter_bookings', (table) => {
    table.string('car_type', 50).notNullable().defaultTo('Luxio');
  });
};

exports.down = function(knex) {
  return knex.schema.alterTable('charter_bookings', (table) => {
    table.dropColumn('car_type');
  });
};
