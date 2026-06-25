exports.up = function(knex) {
  return Promise.all([
    knex.schema.alterTable('promotions', function(table) {
      table.decimal('max_discount', 12, 2).nullable().defaultTo(0);
      table.string('target_service', 50).nullable().defaultTo('all'); // 'travel', 'charter', 'package', 'all'
    }),
    knex.schema.alterTable('travel_bookings', function(table) {
      table.decimal('discount_amount', 12, 2).nullable().defaultTo(0);
    }),
    knex.schema.alterTable('charter_bookings', function(table) {
      table.uuid('promo_id').nullable();
      table.decimal('discount_amount', 12, 2).nullable().defaultTo(0);
    }),
    knex.schema.alterTable('package_shipments', function(table) {
      table.uuid('promo_id').nullable();
      table.decimal('discount_amount', 12, 2).nullable().defaultTo(0);
    })
  ]);
};

exports.down = function(knex) {
  return Promise.all([
    knex.schema.alterTable('promotions', function(table) {
      table.dropColumn('max_discount');
      table.dropColumn('target_service');
    }),
    knex.schema.alterTable('travel_bookings', function(table) {
      table.dropColumn('promo_id');
      table.dropColumn('discount_amount');
    }),
    knex.schema.alterTable('charter_bookings', function(table) {
      table.dropColumn('promo_id');
      table.dropColumn('discount_amount');
    }),
    knex.schema.alterTable('package_shipments', function(table) {
      table.dropColumn('promo_id');
      table.dropColumn('discount_amount');
    })
  ]);
};
