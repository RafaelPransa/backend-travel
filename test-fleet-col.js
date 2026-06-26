const fs = require('fs');
const path = require('path');
const db = require('./src/config/db');

async function test() {
  try {
    const columns = await db('fleets').columnInfo();
    console.log('FLEETS COLUMNS:', Object.keys(columns));
    
    // Check if image_url exists
    if (columns.image_url) {
      console.log('SUCCESS: image_url column is present in fleets table.');
    } else {
      console.log('ERROR: image_url column is MISSING in fleets table.');
    }
  } catch (err) {
    console.error('ERROR:', err);
  } finally {
    db.destroy();
  }
}

test();
