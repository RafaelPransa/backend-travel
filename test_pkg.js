const db = require('./src/config/db');
db('package_shipments')
  .whereIn('fleet_id', ['24b3127d-bbcb-4e38-a667-a2e9d9ca0be0'])
  .whereRaw("DATE(created_at::timestamptz AT TIME ZONE 'Asia/Jakarta') = DATE(CURRENT_TIMESTAMP AT TIME ZONE 'Asia/Jakarta')")
  .whereNot('status', 'delivered')
  .select('fleet_id')
  .count('id as total')
  .groupBy('fleet_id')
  .then(console.log)
  .catch(console.error)
  .finally(() => process.exit(0));
