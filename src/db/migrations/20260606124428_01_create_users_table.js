exports.up = function(knex) {
  return knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 100).notNullable();
    table.string('email', 100).unique().notNullable();
    table.string('password', 255).notNullable();
    table.string('phone_number', 15).notNullable();
    table.enum('role', ['customer', 'driver', 'super_admin'], { useNative: true, enumName: 'user_role' }).defaultTo('customer');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('users').then(() => {
    return knex.raw('DROP TYPE IF EXISTS user_role');
  });
};
