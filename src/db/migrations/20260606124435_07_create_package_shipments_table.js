exports.up = function(knex) {
  return knex.schema.createTable('package_shipments', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('SET NULL');
    table.string('sender_name', 100).notNullable();
    table.string('sender_phone', 15).notNullable();
    table.string('receiver_name', 100).notNullable();
    table.string('receiver_phone', 15).notNullable();
    table.text('receiver_address').notNullable();
    table.string('waybill_number', 50).unique().notNullable();
    table.text('package_description').notNullable();
    table.string('status', 20).defaultTo('received');
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('package_shipments');
};
