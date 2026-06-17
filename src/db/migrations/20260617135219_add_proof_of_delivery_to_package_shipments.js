/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('package_shipments', (table) => {
    table.string('proof_of_delivery_url', 255); // Menyimpan URL bukti serah terima paket
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('package_shipments', (table) => {
    table.dropColumn('proof_of_delivery_url');
  });
};
