const knex = require('./src/config/db.js');

async function test() {
  try {
    const res = await knex.raw("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
    console.log("TABLES:", res.rows.map(r => r.table_name));

    const migrations = await knex('knex_migrations').select('*');
    console.log("MIGRATIONS:", migrations);
  } catch(e) {
    console.error(e.message);
  } finally {
    knex.destroy();
  }
}

test();
