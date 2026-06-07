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
      const expiredBookings = await db('travel_bookings')
        .where('booking_status', 'pending')
        .where('locked_until', '<', db.fn.now())
        .limit(100) // Batasi jumlah record per siklus untuk mencegah overload
        .update({
          booking_status: 'cancelled'
        })
        .returning('id');

      if (expiredBookings.length > 0) {
        console.log(`[Cron Job] ${new Date().toISOString()} - Membatalkan ${expiredBookings.length} pemesanan expired.`);
      }
    } catch (error) {
      console.error('[Cron Job] Error saat menjalankan pembatalan pemesanan expired:', error.message);
    }
  });

  console.log('[Cron Job] Seat Lock Worker (Auto-Cancel) aktif - Interval: setiap 1 menit');
};

module.exports = startSeatLockCron;
