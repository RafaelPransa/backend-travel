const cron = require('node-cron');
const db = require('../config/db');

/**
 * Background Worker: Membatalkan pemesanan yang sudah melewati batas waktu pembayaran.
 * Berjalan setiap 1 menit dan hanya memproses maksimal 100 record per siklus
 * untuk mencegah beban berat pada database.
 */
const startSeatLockCron = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const now = db.fn.now();

      // 1. Auto-cancel Travel
      const expiredTravel = await db('travel_bookings')
        .where('booking_status', 'menunggu_pembayaran')
        .where('locked_until', '<', now)
        .limit(100)
        .update({
          booking_status: 'dibatalkan'
        })
        .returning('id');

      // 2. Auto-cancel Charter
      const expiredCharter = await db('charter_bookings')
        .where('status', 'menunggu_pembayaran')
        .where('locked_until', '<', now)
        .limit(100)
        .update({
          status: 'dibatalkan',
          fleet_id: null
        })
        .returning('id');

      // 3. Auto-cancel Paket
      const expiredPackages = await db('package_shipments')
        .where('transaction_status', 'menunggu_pembayaran')
        .where('locked_until', '<', now)
        .limit(100)
        .update({
          status: 'dibatalkan',
          transaction_status: 'dibatalkan',
          fleet_id: null
        })
        .returning('id');

      if (expiredTravel.length > 0 || expiredCharter.length > 0 || expiredPackages.length > 0) {
        console.log(`[Cron Job] ${new Date().toISOString()} - Auto-canceled: ${expiredTravel.length} Travel, ${expiredCharter.length} Charter, ${expiredPackages.length} Paket.`);
      }
    } catch (error) {
      console.error('[Cron Job] Error saat menjalankan pembatalan pemesanan expired:', error.message);
    }
  });

  console.log('[Cron Job] Seat Lock Worker (Auto-Cancel) aktif - Interval: setiap 1 menit');
};

module.exports = startSeatLockCron;
