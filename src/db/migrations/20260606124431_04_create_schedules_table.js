exports.up = function(knex) {
  return knex.schema.createTable('schedules', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('route_id').references('id').inTable('routes').onDelete('CASCADE');
    table.uuid('fleet_id').references('id').inTable('fleets').onDelete('SET NULL');
    table.uuid('driver_id').references('id').inTable('users').onDelete('SET NULL');
    table.timestamp('departure_time').notNullable();
    table.string('status', 20).defaultTo('scheduled');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('schedules');
};
