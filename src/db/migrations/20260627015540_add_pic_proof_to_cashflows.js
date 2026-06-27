/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('cashflows', (table) => {
    table.string('pic', 100).nullable();
    table.text('proof_url').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('cashflows', (table) => {
    table.dropColumn('pic');
    table.dropColumn('proof_url');
  });
};
