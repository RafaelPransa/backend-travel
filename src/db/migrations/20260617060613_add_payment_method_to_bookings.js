/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Check if enum type exists first
  const hasEnum = await knex.raw(`
    SELECT 1 FROM pg_type t 
    JOIN pg_namespace n ON t.typnamespace = n.oid 
    WHERE t.typname = 'payment_method_type' AND n.nspname = 'public'
  `);
  
  if (hasEnum.rows.length === 0) {
    await knex.raw("CREATE TYPE payment_method_type AS ENUM ('cash', 'cashless')");
  }

  // Add column to travel_bookings
  await knex.schema.alterTable('travel_bookings', (table) => {
    table.specificType('payment_method', 'payment_method_type');
  });

  // Add column to charter_bookings
  await knex.schema.alterTable('charter_bookings', (table) => {
    table.specificType('payment_method', 'payment_method_type');
  });

  // Add column to package_shipments
  await knex.schema.alterTable('package_shipments', (table) => {
    table.specificType('payment_method', 'payment_method_type');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Drop columns
  await knex.schema.alterTable('travel_bookings', (table) => {
    table.dropColumn('payment_method');
  });
  await knex.schema.alterTable('charter_bookings', (table) => {
    table.dropColumn('payment_method');
  });
  await knex.schema.alterTable('package_shipments', (table) => {
    table.dropColumn('payment_method');
  });

  // Drop type
  await knex.raw("DROP TYPE IF EXISTS payment_method_type");
};
