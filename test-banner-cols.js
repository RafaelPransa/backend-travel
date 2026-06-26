const db = require('./src/config/db');

async function test() {
  try {
    const columns = await db('banners').columnInfo();
    console.log('BANNERS COLUMNS:', Object.keys(columns));
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    db.destroy();
  }
}

test();
