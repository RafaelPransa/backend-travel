exports.up = function(knex) {
  return knex.schema.createTable('cashflows', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.decimal('amount', 10, 2).notNullable();
    table.enum('type', ['income', 'expense'], { useNative: true, enumName: 'cashflow_type' }).notNullable();
    table.string('category', 50).notNullable();
    table.text('description');
    table.uuid('reference_id').defaultTo(null);
    table.timestamp('created_at').defaultTo(knex.fn.now());
  });
};

exports.down = function(knex) {
  return knex.schema.dropTableIfExists('cashflows').then(() => {
    return knex.raw('DROP TYPE IF EXISTS cashflow_type');
  });
};
