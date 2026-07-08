const db = require('./src/config/db');

async function cleanTestData() {
  console.log('=== Memulai Pembersihan Data Transaksi & Customer ===');
  
  try {
    await db.transaction(async (trx) => {
      // 1. Hapus Cashflows
      const cashflowCount = await trx('cashflows').del();
      console.log(`- Terhapus dari cashflows: ${cashflowCount} baris`);

      // 2. Hapus Operational Expenses
      const expenseCount = await trx('operational_expenses').del();
      console.log(`- Terhapus dari operational_expenses: ${expenseCount} baris`);

      // 3. Hapus Maintenance Logs
      const maintCount = await trx('maintenance_logs').del();
      console.log(`- Terhapus dari maintenance_logs: ${maintCount} baris`);

      // 4. Hapus Package Shipments
      const packageCount = await trx('package_shipments').del();
      console.log(`- Terhapus dari package_shipments: ${packageCount} baris`);

      // 5. Hapus Charter Bookings
      const charterCount = await trx('charter_bookings').del();
      console.log(`- Terhapus dari charter_bookings: ${charterCount} baris`);

      // 6. Hapus Travel Bookings
      const travelCount = await trx('travel_bookings').del();
      console.log(`- Terhapus dari travel_bookings: ${travelCount} baris`);

      // 7. Hapus Schedules
      const scheduleCount = await trx('schedules').del();
      console.log(`- Terhapus dari schedules: ${scheduleCount} baris`);

      // 8. Hapus Users (Hanya yang role-nya 'customer')
      const customerCount = await trx('users').where('role', 'customer').del();
      console.log(`- Terhapus akun customer dari users: ${customerCount} baris`);
    });

    console.log('\n=== PEMBERSIHAN BERHASIL DAN SELESAI ===');
    console.log('Catatan: Akun Super Admin, Driver, serta data master lainnya tetap aman.');
  } catch (error) {
    console.error('\n❌ Gagal membersihkan data:', error);
  } finally {
    await db.destroy();
    process.exit();
  }
}

cleanTestData();
