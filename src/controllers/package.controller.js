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

    const updatedShipment = await PackageModel.updateStatus(id, status);
    
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

module.exports = {
  createShipment,
  trackPackage,
  updatePackageStatus,
  getPackageHistory
};
