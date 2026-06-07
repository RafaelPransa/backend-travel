const cron = require('node-cron');
const db = require('../config/db');

const startSeatLockCron = () => {
  // Menjalankan task setiap 1 menit (Format Cron: * * * * *)
  cron.schedule('* * * * *', async () => {
    try {
      // Cari booking yang statusnya pending dan waktu locked_until sudah berlalu
      const expiredBookings = await db('travel_bookings')
        .where('booking_status', 'pending')
        .where('locked_until', '<', db.fn.now())
        .update({
          booking_status: 'cancelled'
        })
        .returning('id');

      if (expiredBookings.length > 0) {
        console.log(`[Cron Job] Berhasil membatalkan ${expiredBookings.length} pemesanan yang expired (melewati waktu pembayaran).`);
      }
    } catch (error) {
      console.error('[Cron Job] Error saat menjalankan pembatalan pemesanan expired:', error);
    }
  });

  console.log('[Cron Job] Seat Lock Worker (Auto-Cancel) dihidupkan...');
};

module.exports = startSeatLockCron;
