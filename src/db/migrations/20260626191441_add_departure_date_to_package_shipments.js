/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.alterTable('package_shipments', (table) => {
    table.date('departure_date').nullable();
  });
  
  // Set default departure_date to DATE(created_at) for existing records
  await knex.raw(`
    UPDATE package_shipments 
    SET departure_date = DATE(created_at)
    WHERE departure_date IS NULL
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable('package_shipments', (table) => {
    table.dropColumn('departure_date');
  });
};
