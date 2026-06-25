const TravelModel = require('../models/travel.model');

const getSchedulesAvailability = async (req, res) => {
  try {
    const { route_id } = req.query;
    if (!route_id) {
      return res.status(400).json({ status: 'error', message: 'Parameter route_id wajib disertakan' });
    }
    
    const dates = await TravelModel.getSchedulesAvailability(route_id);
    return res.status(200).json({
      status: 'success',
      message: 'Berhasil mengambil ketersediaan jadwal 14 hari ke depan',
      data: dates
    });
  } catch (error) {
    console.error('Error getSchedulesAvailability:', error);
    return res.status(500).json({ status: 'error', message: 'Gagal mengambil ketersediaan jadwal' });
  }
};

const getSeatsOccupancy = async (req, res) => {
  try {
    const { route_id, date } = req.query;
    if (!route_id || !date) {
      return res.status(400).json({ status: 'error', message: 'Parameter route_id dan date wajib disertakan' });
    }
    
    const seatInfo = await TravelModel.getSeatsOccupancy(route_id, date);
    return res.status(200).json({
      status: 'success',
      message: 'Berhasil mengambil data okupansi kursi',
      data: seatInfo
    });
  } catch (error) {
    console.error('Error getSeatsOccupancy:', error);
    return res.status(500).json({ status: 'error', message: 'Gagal mengambil data okupansi kursi' });
  }
};

const getSchedules = async (req, res) => {
  try {
    const { date, origin, destination } = req.query;
    const schedules = await TravelModel.getSchedules({ date, origin, destination });
    
    return res.status(200).json({
      status: 'success',
      message: 'Berhasil mengambil jadwal travel',
      data: schedules
    });
  } catch (error) {
    console.error('Error getSchedules:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil jadwal travel'
    });
  }
};

const createBooking = async (req, res) => {
  try {
    const { schedule_id, route_id, departure_date, seat_number, pickup_address, dropoff_address, payment_method, baggage_description, baggage_weight, baggage_dimension, promo_id } = req.body;
    const user_id = req.user.id;

    // Untuk booking baru bisa jadi belum ada schedule_id
    if (!schedule_id && (!route_id || !departure_date)) {
      return res.status(400).json({
        status: 'error',
        message: 'Harap sertakan schedule_id atau (route_id dan departure_date)'
      });
    }

    if (schedule_id) {
        const isAvailable = await TravelModel.checkSeatAvailability(schedule_id, seat_number);
        if (!isAvailable) {
          return res.status(400).json({
            status: 'error',
            message: 'Kursi sudah dipesan atau sedang dikunci (menunggu pembayaran) oleh pengguna lain'
          });
        }
    }

    const newBooking = await TravelModel.createBooking({
      user_id,
      schedule_id,
      route_id,
      departure_date,
      seat_number,
      pickup_address,
      dropoff_address,
      payment_method,
      baggage_description,
      baggage_weight,
      baggage_dimension,
      promo_id
    });

    return res.status(201).json({
      status: 'success',
      message: 'Pemesanan berhasil diajukan. Menunggu konfirmasi pembayaran.',
      data: newBooking
    });
  } catch (error) {
    if (error.code === 'BOOKING_CLOSED_TODAY') {
      return res.status(400).json({ status: 'error', message: error.message });
    }
    console.error('Error createBooking:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal membuat booking travel: ' + error.message
    });
  }
};

const getDriverManifest = async (req, res) => {
  try {
    const { schedule_id } = req.params;
    
    const manifest = await TravelModel.getManifest(schedule_id);
    
    return res.status(200).json({
      status: 'success',
      message: 'Berhasil mengambil data manifest penumpang',
      data: manifest
    });
  } catch (error) {
    console.error('Error getDriverManifest:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data manifest penumpang'
    });
  }
};

const getTravelHistory = async (req, res) => {
  try {
    const user_id = req.user.id;
    const history = await TravelModel.getTravelHistory(user_id);

    return res.status(200).json({
      status: 'success',
      message: 'Berhasil mengambil riwayat pemesanan travel',
      data: history
    });
  } catch (error) {
    console.error('Error getTravelHistory:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil riwayat pemesanan travel'
    });
  }
};

const uploadPaymentProof = async (req, res) => {
  try {
    const user_id = req.user.id;
    const booking_id = req.params.id;

    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'File bukti pembayaran tidak ditemukan' });
    }

    const file_url = `${req.protocol}://${req.get('host')}/uploads/payments/${req.file.filename}`;
    const updatedBooking = await TravelModel.uploadPaymentProof(booking_id, user_id, file_url);

    if (!updatedBooking) {
      return res.status(404).json({
        status: 'error',
        message: 'Pesanan tidak ditemukan, bukan milik Anda, atau tiket sudah kadaluarsa/lunas'
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Bukti pembayaran berhasil diunggah. Menunggu verifikasi dari Super Admin.',
      data: updatedBooking
    });
  } catch (error) {
    console.error('Error uploadPaymentProof:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengunggah bukti pembayaran'
    });
  }
};

const updatePaymentMethod = async (req, res) => {
  try {
    const user_id = req.user.id;
    const booking_id = req.params.id;
    const { payment_method } = req.body;

    if (!payment_method || !['cash', 'cashless'].includes(payment_method)) {
      return res.status(400).json({ status: 'error', message: 'Metode pembayaran tidak valid' });
    }

    const updatedBooking = await TravelModel.updatePaymentMethod(booking_id, user_id, payment_method);

    if (!updatedBooking) {
      return res.status(404).json({
        status: 'error',
        message: 'Pesanan tidak ditemukan atau tidak dapat diubah (mungkin status bukan menunggu_pembayaran)'
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Metode pembayaran berhasil diubah',
      data: updatedBooking
    });
  } catch (error) {
    console.error('Error updatePaymentMethod:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengubah metode pembayaran'
    });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const updatedBooking = await TravelModel.cancelBooking(id, userId);
    
    if (!updatedBooking) {
      return res.status(404).json({
        status: 'error',
        message: 'Pesanan tidak ditemukan atau tidak dapat dibatalkan'
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Pesanan berhasil dibatalkan',
      data: updatedBooking
    });
  } catch (error) {
    if (error.code === 'CANCELLATION_TIMEOUT') {
      return res.status(400).json({ status: 'error', message: error.message });
    }
    console.error('Error cancelBooking:', error);
    return res.status(500).json({ status: 'error', message: 'Gagal membatalkan pesanan' });
  }
};

const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const deleted = await TravelModel.deleteBooking(id, userId);
    
    if (!deleted) {
      return res.status(404).json({
        status: 'error',
        message: 'Pesanan tidak ditemukan atau tidak dapat dihapus'
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Riwayat pesanan berhasil dihapus'
    });
  } catch (error) {
    console.error('Error deleteBooking:', error);
    return res.status(500).json({ status: 'error', message: 'Gagal menghapus pesanan' });
  }
};

module.exports = {
  getSchedulesAvailability,
  getSeatsOccupancy,
  getSchedules,
  createBooking,
  getDriverManifest,
  getTravelHistory,
  uploadPaymentProof,
  updatePaymentMethod,
  cancelBooking,
  deleteBooking
};
