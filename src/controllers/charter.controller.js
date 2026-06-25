const CharterModel = require('../models/charter.model');

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

const { getAvailableFleets } = require('../helpers/fleetAvailability');

const requestCharter = async (req, res) => {
  try {
    const { 
      car_type, 
      destination, 
      departure_date, 
      return_date, 
      pickup_address, 
      dropoff_address, 
      with_driver, 
      notes,
      payment_method
    } = req.body;
    const user_id = req.user.id;

    // 1. Cari armada kosong
    const availableFleets = await getAvailableFleets(car_type, departure_date, return_date);
    if (availableFleets.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Maaf, seluruh armada tipe ini sudah penuh dipesan pada tanggal tersebut.'
      });
    }
    
    // Pilih armada pertama yang kosong
    const selectedFleet = availableFleets[0];
    
    // Hitung total hari
    const days = calculateDays(departure_date, return_date);
    
    // Hitung harga dasar
    const basePricePerDay = selectedFleet.price && parseFloat(selectedFleet.price) > 0 
      ? parseFloat(selectedFleet.price) 
      : (selectedFleet.car_type.toLowerCase() === 'elf' ? 1200000 : 800000);
    const offered_price = basePricePerDay * days;

    // Simpan ke database dengan fleet_id dan harga dasar, status menunggu_pembayaran (kunci 10 menit)
    const newRequest = await CharterModel.createRequest({
      user_id,
      car_type,
      fleet_id: selectedFleet.id,
      destination,
      departure_date,
      return_date,
      pickup_address,
      dropoff_address,
      with_driver: with_driver || false,
      notes,
      payment_method,
      offered_price,
      status: 'menunggu_pembayaran' 
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
      message: 'Berhasil mengambil riwayat charter',
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

    let nextStatus = 'selesai';
    if (booking.status === 'menunggu_konfirmasi') {
      if (booking.payment_proof_url) {
        nextStatus = 'selesai';
      } else {
        nextStatus = booking.payment_method === 'cashless' ? 'menunggu_pembayaran' : 'selesai';
      }
    }

    const { driver_id, fleet_id, driver_2_id, offered_price } = req.body;
    const extraFields = {};
    if (driver_id !== undefined) extraFields.driver_id = driver_id;
    if (fleet_id !== undefined) extraFields.fleet_id = fleet_id;
    if (driver_2_id !== undefined) extraFields.driver_2_id = driver_2_id;
    
    // Promo Logic untuk Charter
    if (offered_price !== undefined) {
      let finalPrice = parseFloat(offered_price);
      let originalPrice = finalPrice;
      let appliedPromoId = null;
      let appliedDiscountAmount = 0;
      
      try {
        const db = require('../config/db');
        const promo = await db('promotions').where('is_active', true).first();
        
        if (promo && (promo.target_service.includes('all') || promo.target_service.includes('charter'))) {
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

      extraFields.offered_price = finalPrice;
      extraFields.original_price = originalPrice;
      if (appliedPromoId) {
        extraFields.promo_id = appliedPromoId;
        extraFields.discount_amount = appliedDiscountAmount;
      }
    }

    const updatedBooking = await CharterModel.updateStatus(id, nextStatus, extraFields);

    return res.status(200).json({
      status: 'success',
      message: `Status sewa charter berhasil diperbarui menjadi ${nextStatus}`,
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

const updatePaymentMethod = async (req, res) => {
  try {
    const user_id = req.user.id;
    const booking_id = req.params.id;
    const { payment_method } = req.body;

    if (!payment_method || !['cash', 'cashless'].includes(payment_method)) {
      return res.status(400).json({ status: 'error', message: 'Metode pembayaran tidak valid' });
    }

    const updatedBooking = await CharterModel.updatePaymentMethod(booking_id, user_id, payment_method);

    if (!updatedBooking) {
      return res.status(404).json({
        status: 'error',
        message: 'Pesanan tidak ditemukan atau tidak dapat diubah'
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

module.exports = {
  requestCharter,
  getCharterHistory,
  verifyCharterPayment,
  uploadPaymentProof,
  updatePaymentMethod
};
