exports.up = function(knex) {
  return knex.schema.createTable('travel_bookings', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE');
    table.uuid('schedule_id').references('id').inTable('schedules').onDelete('CASCADE');
    table.integer('seat_number').notNullable();
    table.string('booking_status', 20).defaultTo('pending');
    table.string('payment_proof_url', 255);
    table.timestamp('locked_until');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('travel_bookings');
};
