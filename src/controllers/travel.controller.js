const TravelModel = require('../models/travel.model');

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
    const { schedule_id, seat_number, pickup_address, dropoff_address, payment_method } = req.body;
    const user_id = req.user.id;

    // Pastikan kursi tersedia
    const isAvailable = await TravelModel.checkSeatAvailability(schedule_id, seat_number);
    if (!isAvailable) {
      return res.status(400).json({
        status: 'error',
        message: 'Kursi sudah dipesan atau sedang dikunci (menunggu pembayaran) oleh pengguna lain'
      });
    }

    // Buat booking (otomatis status pending & lock 10 menit)
    const newBooking = await TravelModel.createBooking({
      user_id,
      schedule_id,
      seat_number,
      pickup_address,
      dropoff_address,
      payment_method
    });

    return res.status(201).json({
      status: 'success',
      message: 'Booking berhasil dibuat. Kursi dikunci selama 10 menit, segera lakukan pembayaran.',
      data: newBooking
    });
  } catch (error) {
    console.error('Error createBooking:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal membuat booking travel'
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

    // URL file publik
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

module.exports = {
  getSchedules,
  createBooking,
  getDriverManifest,
  getTravelHistory,
  uploadPaymentProof
};
