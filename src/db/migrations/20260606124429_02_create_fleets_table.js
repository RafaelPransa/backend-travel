exports.up = function(knex) {
  return knex.schema.createTable('fleets', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('plate_number', 15).unique().notNullable();
    table.string('car_type', 50).notNullable();
    table.integer('seat_capacity').notNullable().defaultTo(8);
    table.string('status', 20).defaultTo('active');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('fleets');
};
