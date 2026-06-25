const PackageModel = require('../models/package.model');

const createShipment = async (req, res) => {
  try {
    const {
      sender_name,
      sender_phone,
      pickup_address,
      receiver_name,
      receiver_phone,
      receiver_address,
      package_description,
      weight,
      dimension,
      seat_qty,
      payment_method,
      route_id,
      total_price
    } = req.body;

    const data = {
      sender_name,
      sender_phone,
      pickup_address,
      receiver_name,
      receiver_phone,
      receiver_address,
      package_description,
      weight,
      dimension,
      seat_qty: seat_qty || 1,
      payment_method,
      route_id: route_id || null,
      total_price: total_price || null,
      transaction_status: 'menunggu_konfirmasi',
      status: 'received'
    };
    
    const { departure_date } = req.body;
    if (departure_date) {
      const depDate = new Date(departure_date);
      const now = new Date();
      if (
        depDate.getFullYear() === now.getFullYear() &&
        depDate.getMonth() === now.getMonth() &&
        depDate.getDate() === now.getDate()
      ) {
        if (now.getHours() >= 14) {
          return res.status(400).json({
            status: 'error',
            message: 'Pengiriman untuk hari ini sudah ditutup (armada berangkat jam 15:00). Silakan pilih tanggal besok atau lainnya.'
          });
        }
      }
    }
    
    // Jika ada token yang valid dari customer, kita bisa ambil user_id dari req.user opsional
    if (req.user && req.user.id) {
      data.user_id = req.user.id;
    }

    // Nomor resi (waybill_number) akan digenerate otomatis oleh trigger database trg_generate_waybill
    const newShipment = await PackageModel.createShipment(data);

    const message = newShipment.is_double_charge
      ? 'Pengiriman paket berhasil dibuat. Paket terdeteksi melebihi kapasitas standar dan dikenakan tarif ganda (double charge).'
      : 'Pengiriman paket berhasil dibuat';

    return res.status(201).json({
      status: 'success',
      message,
      data: newShipment
    });
  } catch (error) {
    console.error('Error createShipment:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal membuat pengiriman paket'
    });
  }
};

const trackPackage = async (req, res) => {
  try {
    const { waybill_number } = req.params;

    const shipment = await PackageModel.findByWaybill(waybill_number);
    if (!shipment) {
      return res.status(404).json({
        status: 'error',
        message: 'Resi tidak ditemukan'
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Berhasil melacak paket',
      data: shipment
    });
  } catch (error) {
    console.error('Error trackPackage:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal melacak paket'
    });
  }
};

const updatePackageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Supir wajib mengunggah foto bukti serah terima paket pada tahap akhir (delivered / Sampai Tujuan)
    if (status === 'delivered' && !req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'Bukti penyerahan paket (foto penyerahan fisik) wajib diunggah untuk status Sampai Tujuan (delivered)'
      });
    }

    let proof_of_delivery_url = null;
    if (req.file) {
      proof_of_delivery_url = `${req.protocol}://${req.get('host')}/uploads/packages/${req.file.filename}`;
    }

    const updatedShipment = await PackageModel.updateStatus(id, status, proof_of_delivery_url);
    
    if (!updatedShipment) {
      return res.status(404).json({
        status: 'error',
        message: 'Data paket tidak ditemukan'
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Status paket berhasil diperbarui',
      data: updatedShipment
    });
  } catch (error) {
    console.error('Error updatePackageStatus:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memperbarui status paket'
    });
  }
};

const getPackageHistory = async (req, res) => {
  try {
    const user_id = req.user.id;
    const history = await PackageModel.getPackageHistory(user_id);

    return res.status(200).json({
      status: 'success',
      message: 'Berhasil mengambil riwayat pengiriman paket',
      data: history
    });
  } catch (error) {
    console.error('Error getPackageHistory:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil riwayat pengiriman paket'
    });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const updatedBooking = await PackageModel.cancelBooking(id, userId);
    
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

    const deleted = await PackageModel.deleteBooking(id, userId);
    
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

const updatePaymentMethod = async (req, res) => {
  try {
    const user_id = req.user.id;
    const booking_id = req.params.id;
    const { payment_method } = req.body;

    if (!payment_method || !['cash', 'cashless'].includes(payment_method)) {
      return res.status(400).json({ status: 'error', message: 'Metode pembayaran tidak valid' });
    }

    const updatedBooking = await PackageModel.updatePaymentMethod(booking_id, user_id, payment_method);

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
  createShipment,
  trackPackage,
  updatePackageStatus,
  getPackageHistory,
  cancelBooking,
  deleteBooking,
  updatePaymentMethod
};
