/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('charter_bookings', (table) => {
    table.string('payment_proof_url', 255).defaultTo(null);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('charter_bookings', (table) => {
    table.dropColumn('payment_proof_url');
  });
};
