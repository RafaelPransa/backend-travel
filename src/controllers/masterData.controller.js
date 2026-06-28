const MasterDataModel = require('../models/masterData.model');
const bcrypt = require('bcryptjs');

// Helper untuk validasi hari operasional rute travel regular
const validateScheduleDay = async (routeId, departureTime) => {
  const route = await MasterDataModel.getById('routes', routeId);
  if (!route) {
    throw new Error('Rute tidak ditemukan');
  }

  const depDate = new Date(departureTime);
  if (isNaN(depDate.getTime())) {
    throw new Error('Format waktu keberangkatan tidak valid');
  }

  // Dapatkan nama hari lokal dengan zona waktu Jakarta
  const localDay = depDate.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'long' }).toLowerCase();

  const origin = route.origin.toLowerCase();
  const dest = route.destination.toLowerCase();

  if (origin === 'jakarta' && dest === 'panawangan') {
    // Jakarta -> Panawangan: Senin, Rabu, Minggu
    const allowed = ['senin', 'rabu', 'minggu'];
    if (!allowed.includes(localDay)) {
      throw new Error('Jadwal keberangkatan Jakarta ke Panawangan hanya diperbolehkan pada hari Senin, Rabu, dan Minggu');
    }
  } else if (origin === 'panawangan' && dest === 'jakarta') {
    // Panawangan -> Jakarta: Selasa, Kamis, Minggu
    const allowed = ['selasa', 'kamis', 'minggu'];
    if (!allowed.includes(localDay)) {
      throw new Error('Jadwal keberangkatan Panawangan ke Jakarta hanya diperbolehkan pada hari Selasa, Kamis, dan Minggu');
    }
  }
};

// Generic CRUD handlers
const { getAvailableFleets } = require('../helpers/fleetAvailability');

const getRecords = (table) => async (req, res) => {
  try {
    let records = await MasterDataModel.getTableData(table);
    
    // Khusus admin fleets, deteksi status real-time untuk hari ini
    if (table === 'fleets') {
      const today = new Date().toISOString().split('T')[0];
      const availableToday = await getAvailableFleets(null, today, today);
      const availableIds = new Set(availableToday.map(f => f.id));
      
      records = records.map(fleet => {
        if (fleet.status === 'active' && !availableIds.has(fleet.id)) {
          return { ...fleet, status: 'Sedang Disewa / Beroperasi' };
        }
        return fleet;
      });
    }
    
    return res.status(200).json({ status: 'success', message: `Berhasil mengambil data dari tabel ${table}`, data: records });
  } catch (error) {
    console.error(`Error getRecords ${table}:`, error);
    return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan server' });
  }
};

const createRecord = (table) => async (req, res) => {
  try {
    const data = { ...req.body };
    
    if (data.is_active === 'true') data.is_active = true;
    if (data.is_active === 'false') data.is_active = false;

    // Khusus tabel users, hash password
    if (table === 'users' && data.password) {
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(data.password, salt);
    }

    // Validasi hari keberangkatan rute travel
    if (table === 'schedules') {
      try {
        await validateScheduleDay(data.route_id, data.departure_time);
      } catch (err) {
        return res.status(400).json({ status: 'error', message: err.message });
      }
    }

    // Singleton logic for Promotions
    if (table === 'promotions' && (data.is_active === true || data.is_active === 'true')) {
      const db = require('../config/db');
      await db('promotions').update({ is_active: false });
    }

    const newRecord = await MasterDataModel.createRecord(table, data);
    return res.status(201).json({ status: 'success', message: 'Data berhasil ditambahkan', data: newRecord });
  } catch (error) {
    console.error(`Error createRecord ${table}:`, error);
    return res.status(500).json({ status: 'error', message: `Gagal menambah data: ${error.message}` });
  }
};

const updateRecord = (table) => async (req, res) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };

    if (data.is_active === 'true') data.is_active = true;
    if (data.is_active === 'false') data.is_active = false;

    if (table === 'users' && data.password) {
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(data.password, salt);
    }

    // Validasi hari keberangkatan rute travel
    if (table === 'schedules') {
      const current = await MasterDataModel.getById('schedules', id);
      if (current) {
        const routeId = data.route_id || current.route_id;
        const depTime = data.departure_time || current.departure_time;
        if (routeId && depTime) {
          try {
            await validateScheduleDay(routeId, depTime);
          } catch (err) {
            return res.status(400).json({ status: 'error', message: err.message });
          }
        }
      }
    }

    // Singleton logic for Promotions
    if (table === 'promotions' && (data.is_active === true || data.is_active === 'true')) {
      const db = require('../config/db');
      await db('promotions').whereNot('id', id).update({ is_active: false });
    }

    const updated = await MasterDataModel.updateRecord(table, id, data);
    if (!updated) {
      return res.status(404).json({ status: 'error', message: 'Data tidak ditemukan' });
    }

    // CREATE SCHEDULE JIKA PAKET DIVALIDASI (Agar muncul di Penugasan Armada)
    if (table === 'package_shipments' && updated.transaction_status === 'selesai' && updated.fleet_id && updated.departure_date) {
      const db = require('../config/db');
      const existingSchedule = await db('schedules')
        .where('fleet_id', updated.fleet_id)
        .whereRaw('DATE(departure_time) = ?', [updated.departure_date])
        .first();

      if (!existingSchedule) {
        // Jika belum ada jadwal, buat jadwal baru on-the-fly untuk fleet ini agar butuh penugasan
        const departureTime = new Date(updated.departure_date);
        departureTime.setHours(8, 0, 0, 0); // Default ke jam 8 pagi
        await db('schedules').insert({
          route_id: updated.route_id || null,
          fleet_id: updated.fleet_id,
          departure_time: departureTime,
          status: 'scheduled'
        });
      }
    }

    // AUTO MERGE JIKA TRAVEL DIVALIDASI
    if (table === 'travel_bookings' && updated.booking_status === 'dibayar' && data.booking_status === 'dibayar') {
      const db = require('../config/db');
      const schedule = await db('schedules').where('id', updated.schedule_id).first();
      if (schedule && schedule.fleet_id && schedule.departure_time) {
        const departureDate = new Date(schedule.departure_time).toISOString().split('T')[0];
        const { autoMergePackagesToRoute } = require('../models/travel.model');
        await autoMergePackagesToRoute(schedule.id, departureDate);
      }
    }

    return res.status(200).json({ status: 'success', message: 'Data berhasil diubah', data: updated });
  } catch (error) {
    console.error(`Error updateRecord ${table}:`, error);
    return res.status(500).json({ status: 'error', message: 'Gagal mengubah data' });
  }
};

const deleteRecord = (table) => async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await MasterDataModel.deleteRecord(table, id);
    if (!deleted) {
      return res.status(404).json({ status: 'error', message: 'Data tidak ditemukan' });
    }
    return res.status(200).json({ status: 'success', message: 'Data berhasil dihapus' });
  } catch (error) {
    console.error(`Error deleteRecord ${table}:`, error);
    return res.status(500).json({ status: 'error', message: 'Gagal menghapus data. Data ini masih terhubung dengan data lain di sistem.' });
  }
};

// Khusus Assign Schedule
const assignSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { fleet_id, driver_id, driver_2_id } = req.body;
    
    const updated = await MasterDataModel.updateRecord('schedules', id, { 
      fleet_id, 
      driver_id, 
      driver_2_id: driver_2_id || null 
    });
    if (!updated) {
      return res.status(404).json({ status: 'error', message: 'Jadwal tidak ditemukan' });
    }
    return res.status(200).json({ status: 'success', message: 'Berhasil menugaskan armada dan driver', data: updated });
  } catch (error) {
    console.error('Error assignSchedule:', error);
    return res.status(500).json({ status: 'error', message: 'Gagal menugaskan driver' });
  }
};

const getTravelBookings = async (req, res) => {
  try {
    const bookings = await MasterDataModel.getTravelBookings();
    return res.status(200).json({ status: 'success', message: 'Berhasil mengambil antrean booking tiket travel', data: bookings });
  } catch (error) {
    console.error('Error getTravelBookings:', error);
    return res.status(500).json({ status: 'error', message: 'Gagal mengambil data pemesanan travel' });
  }
};

const verifyTravelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await MasterDataModel.verifyTravelBooking(id);

    if (!updated) {
      return res.status(404).json({
        status: 'error',
        message: 'Pesanan tidak ditemukan atau pelanggan belum mengunggah bukti pembayaran'
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Pembayaran tiket travel berhasil diverifikasi',
      data: updated
    });
  } catch (error) {
    console.error('Error verifyTravelBooking:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memverifikasi pembayaran tiket travel'
    });
  }
};

const updateTravelBookingStatus = async (req, res) => {
//... existing ...
    try {
      const { id } = req.params;
      const { booking_status, eta, price } = req.body;
      
      const updatePayload = { booking_status, eta };

      if (price !== undefined) {
        let finalPrice = parseFloat(price);
        let originalPrice = finalPrice;
        let appliedPromoId = null;
        let appliedDiscountAmount = 0;
        
        try {
          const db = require('../config/db');
          const promo = await db('promotions').where('is_active', true).first();
          
          if (promo && (promo.target_service.includes('all') || promo.target_service.includes('travel'))) {
            let discount = finalPrice * (parseFloat(promo.discount_percentage) / 100);
            
            if (promo.max_discount && parseFloat(promo.max_discount) > 0) {
              const maxDiscount = parseFloat(promo.max_discount);
              if (discount > maxDiscount) {
                discount = maxDiscount;
              }
            }
            
            finalPrice = finalPrice - discount;
            appliedPromoId = promo.id;
            appliedDiscountAmount = discount;
          }
        } catch (err) {
          console.error("Promo calculation error:", err);
        }

        updatePayload.price = finalPrice;
        updatePayload.original_price = originalPrice;
        if (appliedPromoId) {
          updatePayload.promo_id = appliedPromoId;
          updatePayload.discount_amount = appliedDiscountAmount;
        }
      }
  
      const updated = await MasterDataModel.updateTravelBookingStatus(id, updatePayload);

    if (!updated) {
      return res.status(404).json({
        status: 'error',
        message: 'Pesanan tidak ditemukan'
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Data pemesanan travel berhasil diperbarui',
      data: updated
    });
  } catch (error) {
    console.error('Error updateTravelBookingStatus:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memperbarui status pemesanan travel'
    });
  }
};

const getPackageShipments = async (req, res) => {
  try {
    const shipments = await MasterDataModel.getPackageShipments();
    return res.status(200).json({ status: 'success', message: 'Berhasil mengambil data pengiriman paket', data: shipments });
  } catch (error) {
    console.error('Error getPackageShipments:', error);
    return res.status(500).json({ status: 'error', message: 'Gagal mengambil data pengiriman paket' });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const data = { ...req.body };

    const targetUser = await MasterDataModel.getById('users', id);
    if (!targetUser) {
      return res.status(404).json({ status: 'error', message: 'Pengguna tidak ditemukan' });
    }

    if (targetUser.role === 'super_admin') {
      return res.status(403).json({ status: 'error', message: 'Perubahan pada akun Super Admin tidak diizinkan' });
    }

    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(data.password, salt);
    }

    const updated = await MasterDataModel.updateRecord('users', id, data);
    return res.status(200).json({ status: 'success', message: 'Data pengguna berhasil diubah', data: updated });
  } catch (error) {
    console.error('Error updateUser:', error);
    return res.status(500).json({ status: 'error', message: 'Gagal mengubah data pengguna' });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const targetUser = await MasterDataModel.getById('users', id);
    if (!targetUser) {
      return res.status(404).json({ status: 'error', message: 'Pengguna tidak ditemukan' });
    }

    if (targetUser.role === 'super_admin') {
      return res.status(403).json({ status: 'error', message: 'Penghapusan akun Super Admin tidak diizinkan' });
    }

    await MasterDataModel.deleteRecord('users', id);
    return res.status(200).json({ status: 'success', message: 'Pengguna berhasil dihapus' });
  } catch (error) {
    console.error('Error deleteUser:', error);
    return res.status(500).json({ status: 'error', message: 'Gagal menghapus pengguna' });
  }
};

const departSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    
    const schedule = await db('schedules').where({ id }).first();
    if (!schedule) {
      return res.status(404).json({ status: 'error', message: 'Jadwal tidak ditemukan' });
    }

    if (schedule.status === 'departed' || schedule.status === 'completed') {
      return res.status(400).json({ status: 'error', message: 'Jadwal sudah diberangkatkan atau selesai' });
    }

    await db.transaction(async (trx) => {
      // 1. Update status jadwal menjadi departed
      await trx('schedules')
        .where({ id })
        .update({ status: 'departed' });

      // 2. Update status penumpang (travel_bookings) yang lunas menjadi on_transit
      await trx('travel_bookings')
        .where('schedule_id', id)
        .where('booking_status', 'selesai')
        .update({ booking_status: 'on_transit' });

      // 3. Update status paket yang menumpang armada ini
      if (schedule.fleet_id && schedule.departure_time) {
        const depDateStr = new Date(schedule.departure_time).toISOString().split('T')[0];
        
        await trx('package_shipments')
          .where('fleet_id', schedule.fleet_id)
          .whereRaw('DATE(departure_date) = ?', [depDateStr])
          .whereIn('transaction_status', ['selesai'])
          .whereNotIn('status', ['dibatalkan', 'ditolak', 'REJECTED'])
          .update({ status: 'on_transit' });
      }
    });

    return res.status(200).json({ status: 'success', message: 'Berhasil mengkonfirmasi keberangkatan massal' });
  } catch (error) {
    console.error('Error departSchedule:', error);
    return res.status(500).json({ status: 'error', message: 'Gagal mengkonfirmasi keberangkatan massal' });
  }
};

const deleteTravelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await MasterDataModel.deleteTravelBooking(id);
    if (!deleted) {
      return res.status(404).json({
        status: 'error',
        message: 'Pesanan tidak ditemukan'
      });
    }
    return res.status(200).json({
      status: 'success',
      message: 'Riwayat pesanan berhasil dihapus secara permanen'
    });
  } catch (error) {
    console.error('Error deleteTravelBooking:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal menghapus riwayat pesanan'
    });
  }
};

module.exports = {
  getRecords,
  createRecord,
  updateRecord,
  deleteRecord,
  assignSchedule,
  getTravelBookings,
  verifyTravelBooking,
  updateTravelBookingStatus,
  deleteTravelBooking,
  getPackageShipments,
  updateUser,
  deleteUser,
  departSchedule
};
