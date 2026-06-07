const CharterModel = require('../models/charter.model');

// Tarif resmi per hari (Konstanta, sesuai PRD.md)
const TARIFF_PER_DAY = {
  Luxio: 1200000,
  Elf: 1500000
};

/**
 * Menghitung jumlah hari sewa (inklusif).
 * Contoh: Berangkat 1 Juli, Pulang 3 Juli = 3 hari (bukan 2).
 * Jika tanggal sama (berangkat dan pulang di hari yang sama) = 1 hari.
 */
const calculateDays = (start, end) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const timeDiff = endDate.getTime() - startDate.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

  // Minimal 1 hari, dan inklusif (tambah 1 hari untuk menghitung hari keberangkatan)
  return Math.max(daysDiff + 1, 1);
};

const requestCharter = async (req, res) => {
  try {
    const { car_type, destination, departure_date, return_date, notes } = req.body;
    const user_id = req.user.id;

    const days = calculateDays(departure_date, return_date);
    
    // Tarif sesuai armada (dari konstanta, bukan hardcode angka)
    const tariffPerDay = TARIFF_PER_DAY[car_type];
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

const uploadPaymentProof = async (req, res) => {
  try {
    const user_id = req.user.id;
    const charter_id = req.params.id;

    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'File bukti pembayaran tidak ditemukan' });
    }

    const file_url = `${req.protocol}://${req.get('host')}/uploads/payments/${req.file.filename}`;

    const updatedCharter = await CharterModel.uploadPaymentProof(charter_id, user_id, file_url);

    if (!updatedCharter) {
      return res.status(404).json({
        status: 'error',
        message: 'Pengajuan charter tidak ditemukan, bukan milik Anda, atau sudah diproses/lunas'
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Bukti pembayaran charter berhasil diunggah. Menunggu verifikasi dari Super Admin.',
      data: updatedCharter
    });
  } catch (error) {
    console.error('Error uploadPaymentProof charter:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengunggah bukti pembayaran charter'
    });
  }
};

module.exports = {
  requestCharter,
  getCharterHistory,
  verifyCharterPayment,
  uploadPaymentProof
};
