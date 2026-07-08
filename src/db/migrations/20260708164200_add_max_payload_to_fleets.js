/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.table('fleets', (table) => {
    table.integer('max_payload').notNullable().defaultTo(1450); // Default Luxio = 1450 kg
  }).then(() => {
    // Update existing Elf fleets to 2000 kg
    return knex('fleets').where('car_type', 'Elf').update({ max_payload: 2000 });
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.table('fleets', (table) => {
    table.dropColumn('max_payload');
  });
};
