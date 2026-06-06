exports.up = function(knex) {
  return knex.schema.createTable('charter_bookings', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.string('destination', 255).notNullable();
    table.date('departure_date').notNullable();
    table.date('return_date').notNullable();
    table.text('notes');
    table.decimal('offered_price', 10, 2).defaultTo(null);
    table.string('status', 20).defaultTo('pending');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('charter_bookings');
};
