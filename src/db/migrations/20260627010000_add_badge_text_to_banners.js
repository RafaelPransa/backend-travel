/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.alterTable('banners', (table) => {
    table.string('badge_text').nullable();
    table.text('description').nullable();
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable('banners', (table) => {
    table.dropColumn('badge_text');
    table.dropColumn('description');
  });
};
