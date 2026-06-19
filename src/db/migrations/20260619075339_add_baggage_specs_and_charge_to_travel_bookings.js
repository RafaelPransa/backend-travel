/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.alterTable('travel_bookings', (table) => {
    table.decimal('baggage_weight', 5, 2);
    table.string('baggage_dimension', 20);
    table.boolean('is_baggage_charge').defaultTo(false);
  });

  await knex.raw(`
    ALTER TABLE travel_bookings 
    ADD CONSTRAINT travel_bookings_baggage_dimension_check 
    CHECK (baggage_dimension IN ('kecil', 'sedang', 'besar', 'super_besar'))
  `);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.raw("ALTER TABLE travel_bookings DROP CONSTRAINT IF EXISTS travel_bookings_baggage_dimension_check");
  await knex.schema.alterTable('travel_bookings', (table) => {
    table.dropColumn('baggage_weight');
    table.dropColumn('baggage_dimension');
    table.dropColumn('is_baggage_charge');
  });
};
