const CharterModel = require('../models/charter.model');

// Fungsi untuk menghitung selisih hari
const calculateDays = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const timeDiff = endDate.getTime() - startDate.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  // Minimal 1 hari
  return daysDiff === 0 ? 1 : daysDiff;
};

const requestCharter = async (req, res) => {
  try {
    const { car_type, destination, departure_date, return_date, notes } = req.body;
    const user_id = req.user.id;

    const days = calculateDays(departure_date, return_date);
    
    // Tarif sesuai armada
    const tariffPerDay = car_type === 'Luxio' ? 1200000 : 1500000;
    const offered_price = days * tariffPerDay;

    const newRequest = await CharterModel.createRequest({
      user_id,
      car_type,
      destination,
      departure_date,
      return_date,
      notes,
      offered_price,
      status: 'pending' // Menunggu bukti bayar divalidasi
    });

    return res.status(201).json({
      status: 'success',
      message: 'Pengajuan charter berhasil dibuat. Silakan lakukan pembayaran.',
      data: {
        ...newRequest,
        total_days: days
      }
    });

  } catch (error) {
    console.error('Error requestCharter:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal membuat pengajuan charter'
    });
  }
};

const getCharterHistory = async (req, res) => {
  try {
    const user_id = req.user.id;
    const role = req.user.role;

    const history = await CharterModel.getHistory(user_id, role);

    return res.status(200).json({
      status: 'success',
      data: history
    });

  } catch (error) {
    console.error('Error getCharterHistory:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil riwayat charter'
    });
  }
};

const verifyCharterPayment = async (req, res) => {
  try {
    const { id } = req.params;

    // Cek apakah booking ada
    const booking = await CharterModel.getById(id);
    if (!booking) {
      return res.status(404).json({
        status: 'error',
        message: 'Pengajuan charter tidak ditemukan'
      });
    }

    const updatedBooking = await CharterModel.updateStatus(id, 'paid');

    return res.status(200).json({
      status: 'success',
      message: 'Pembayaran charter berhasil diverifikasi',
      data: updatedBooking
    });

  } catch (error) {
    console.error('Error verifyCharterPayment:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memverifikasi pembayaran charter'
    });
  }
};

module.exports = {
  requestCharter,
  getCharterHistory,
  verifyCharterPayment
};
