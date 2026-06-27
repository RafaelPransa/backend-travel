const cron = require('node-cron');
const db = require('../config/db');

const startAutoTransitionCron = () => {
  // Berjalan setiap menit pada jam 12:00 - 23:59 untuk mengecek jadwal yang harus dipindahkan ke Sedang Bertugas.
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      // Pastikan sudah jam 12 siang atau lebih
      if (now.getHours() >= 12) {
        const todayStr = now.toISOString().split('T')[0];

        await db.transaction(async (trx) => {
          // 1. Update RUTE
          // Cari jadwal RUTE hari ini (atau sebelumnya) yang driver_id != null dan status masih 'scheduled'
          const routeUpdated = await trx('schedules')
            .whereNotNull('driver_id')
            .where('status', 'scheduled')
            .whereRaw('DATE(departure_time) <= ?', [todayStr])
            .update({ status: 'on_going' });
            
          if (routeUpdated > 0) {
            console.log(`[CRON] Auto-transitioned ${routeUpdated} RUTE schedules to 'on_going' at ${now.toISOString()}`);
          }

          // Update juga status travel_bookings di dalam jadwal tersebut (opsional, tp disamakan dengan force_active)
          if (routeUpdated > 0) {
             // Subquery untuk update travel_bookings
             await trx.raw(`
                UPDATE travel_bookings 
                SET booking_status = 'dalam_penjemputan' 
                WHERE schedule_id IN (
                    SELECT id FROM schedules 
                    WHERE driver_id IS NOT NULL 
                    AND status = 'on_going' 
                    AND DATE(departure_time) = ?
                )
                AND booking_status IN ('menunggu_penjemputan', 'dibayar', 'selesai')
             `, [todayStr]);
          }

          // 2. Update CHARTER
          // Cari CHARTER hari ini (atau sebelumnya) yang driver_id != null dan status 'disetujui'/'dibayar'
          const charterUpdated = await trx('charter_bookings')
            .whereNotNull('driver_id')
            .whereIn('status', ['dibayar', 'disetujui', 'menunggu_penjemputan'])
            .whereRaw('DATE(departure_date) <= ?', [todayStr])
            .update({ status: 'dalam_penjemputan' });
            
          if (charterUpdated > 0) {
            console.log(`[CRON] Auto-transitioned ${charterUpdated} CHARTER bookings to 'dalam_penjemputan' at ${now.toISOString()}`);
          }
        });
      }
    } catch (error) {
      console.error('[CRON Error] Failed to execute auto transition cron:', error);
    }
  });

  console.log('Cron Job: Auto Transition Scheduler started');
};

module.exports = startAutoTransitionCron;
