/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // 1. Hapus user dengan role 'mechanic'
  await knex('users').where('role', 'mechanic').del();

  // 2. Re-create enum type 'user_role' untuk menghapus 'mechanic'
  await knex.raw('ALTER TYPE user_role RENAME TO user_role_old');
  await knex.raw("CREATE TYPE user_role AS ENUM ('customer', 'driver', 'super_admin')");
  await knex.raw('ALTER TABLE users ALTER COLUMN role DROP DEFAULT');
  await knex.raw('ALTER TABLE users ALTER COLUMN role TYPE user_role USING role::text::user_role');
  await knex.raw("ALTER TABLE users ALTER COLUMN role SET DEFAULT 'customer'::user_role");
  await knex.raw('DROP TYPE user_role_old');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Rollback: Kembalikan nilai 'mechanic' ke enum user_role
  await knex.raw("ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'mechanic'");
};
