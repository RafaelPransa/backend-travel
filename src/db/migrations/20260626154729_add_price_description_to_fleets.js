/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('fleets', function(table) {
    table.decimal('price', 14, 2).nullable();
    table.text('description').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('fleets', function(table) {
    table.dropColumn('price');
    table.dropColumn('description');
  });
};
