exports.up = function(knex) {
  return Promise.all([
    knex.schema.alterTable('travel_bookings', function(table) {
      table.decimal('original_price', 12, 2).nullable();
    }),
    knex.schema.alterTable('charter_bookings', function(table) {
      table.decimal('original_price', 12, 2).nullable();
    }),
    knex.schema.alterTable('package_shipments', function(table) {
      table.decimal('original_price', 12, 2).nullable();
    })
  ]);
};

exports.down = function(knex) {
  return Promise.all([
    knex.schema.alterTable('travel_bookings', function(table) {
      table.dropColumn('original_price');
    }),
    knex.schema.alterTable('charter_bookings', function(table) {
      table.dropColumn('original_price');
    }),
    knex.schema.alterTable('package_shipments', function(table) {
      table.dropColumn('original_price');
    })
  ]);
};
