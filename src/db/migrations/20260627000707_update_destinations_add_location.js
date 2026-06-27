exports.up = function(knex) {
  return knex.schema.table('destinations', function(table) {
    table.string('location').nullable();
  });
};

exports.down = function(knex) {
  return knex.schema.table('destinations', function(table) {
    table.dropColumn('location');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  
};
