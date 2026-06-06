exports.up = function(knex) {
  return knex.schema.createTable('routes', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('origin', 50).notNullable();
    table.string('destination', 50).notNullable();
    table.decimal('base_price', 10, 2).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('routes');
};
