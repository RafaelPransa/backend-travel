const PackageModel = require('../models/package.model');
const { isJabodetabek } = require('../utils/jabodetabek');
const { getAvailableFleets } = require('../helpers/fleetAvailability');
const TravelModel = require('../models/travel.model');
const db = require('../config/db');

const checkAvailability = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ status: 'error', message: 'Parameter date wajib diisi' });
    }

    // 1. Cek armada idle (yang tidak dijadwalkan dan tidak dicharter pada tanggal ini)
    const idleFleets = await getAvailableFleets(null, date, date, null, null, 'PAKET');
    let isAvailable = idleFleets.length > 0;

    // 2. Jika tidak ada armada idle, cek apakah armada yang dijadwalkan Rute hari ini masih ada sisa kapasitas
    if (!isAvailable) {
      const schedules = await db('schedules')
        .whereRaw('DATE(departure_time) = ?', [date])
        .where('status', 'scheduled');

      for (const sched of schedules) {
        const loadInfo = await TravelModel.calculateLoad(sched.route_id, date);
        if (loadInfo.status !== 'full') {
          isAvailable = true; // Ada schedule Rute yang belum penuh, Paket bisa menumpang
          break;
        }
      }
    }

    return res.status(200).json({
      status: 'success',
      data: { available: isAvailable }
    });
  } catch (error) {
    console.error('Error checkAvailability package:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengecek ketersediaan paket'
    });
  }
};

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
      total_price,
      receiver_kecamatan
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
      payment_method,
      route_id: route_id || null,
      departure_date: req.body.departure_date ? new Date(new Date(req.body.departure_date).getTime() + 7 * 3600 * 1000).toISOString().split('T')[0] : new Date(Date.now() + 7 * 3600 * 1000).toISOString().split('T')[0],
      transaction_status: 'menunggu_konfirmasi',
      status: 'received',
      waybill_number: 'PKT-' + Date.now().toString().slice(-6) + '-' + Math.random().toString(36).substring(2, 6).toUpperCase()
    };
    
    if (req.user && req.user.id) {
      data.user_id = req.user.id;
    }
    
    if (receiver_kecamatan && isJabodetabek(receiver_kecamatan)) {
      data.original_price = 250000;
      data.transaction_status = 'menunggu_pembayaran';
      // status 'received' means the package is received by the system? Keep it as received or menunggu_pembayaran? 
      // Usually status is general tracking status, transaction_status is payment status.
      // Wait, in charter we map transaction_status? 
      data.status = 'menunggu_pembayaran'; // Based on requirements: "langsung memindahkan status ke menunggu pembayaran"
    }
    
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

      // CHECK AVAILABILITY SEBELUM MEMBUAT PAKET
      const { getAvailableFleets } = require('../helpers/fleetAvailability');
      const TravelModel = require('../models/travel.model');
      const db = require('../config/db');

      const requiredSeats = (weight >= 60 || dimension === 'super_besar') ? 2 : 1;

      let isAvailable = false;
      let assignedFleetId = null;
      let assignedSeatNumbers = [];

      // 1. PRIORITAS UTAMA: Cek armada yang dijadwalkan Rute hari ini (Penumpang)
      // Tujuannya agar paket numpang di mobil rute yang sudah akan berangkat
      const schedules = await db('schedules')
        .whereRaw('DATE(departure_time) = ?', [departure_date])
        .where('status', 'scheduled');

      for (const sched of schedules) {
        const loadInfo = await TravelModel.calculateLoad(sched.route_id, departure_date);
        if (loadInfo.sisa_kursi >= requiredSeats && (loadInfo.total_weight + parseFloat(weight)) <= loadInfo.max_payload) {
          isAvailable = true;
          assignedFleetId = sched.fleet_id;
          
          // Pick empty seats from the back
          let seatsToAssign = [];
          for (let i = loadInfo.max_capacity; i >= 1; i--) {
              if (!loadInfo.occupied_seats_list.includes(i)) {
                  seatsToAssign.push(i);
                  if (seatsToAssign.length === requiredSeats) break;
              }
          }
          assignedSeatNumbers = seatsToAssign;
          break;
        }
      }

      // 2. PRIORITAS KEDUA: Jika semua rute penuh / tidak ada rute, pakai mobil nganggur (Idle)
      if (!isAvailable) {
        const idleFleets = await getAvailableFleets(null, departure_date, departure_date, null, null, 'PAKET');
        
        for (const idle of idleFleets) {
          if (idle.seat_capacity >= requiredSeats) {
            // Cek batas payload kargo untuk armada idle ini
            const activePackagesWeight = await db('package_shipments')
              .where('fleet_id', idle.id)
              .where('departure_date', departure_date)
              .whereNotIn('status', ['delivered', 'dibatalkan', 'ditolak'])
              .sum('weight as total_weight')
              .first();
            const currentWeight = parseFloat(activePackagesWeight.total_weight || 0);

            if (currentWeight + parseFloat(weight) <= idle.max_payload) {
              isAvailable = true;
              assignedFleetId = idle.id;
              // Assign seats from the back
              for (let i = idle.seat_capacity; i > idle.seat_capacity - requiredSeats; i--) {
                assignedSeatNumbers.push(i);
              }
              break;
            }
          }
        }
      }

      if (!isAvailable) {
        return res.status(400).json({
            status: 'error',
            message: 'Mohon maaf, kapasitas armada pengiriman sudah penuh pada tanggal tersebut. Silakan pilih tanggal lain.'
        });
      }

      data.fleet_id = assignedFleetId;
      data.seat_numbers = JSON.stringify(assignedSeatNumbers);
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

const uploadPaymentProof = async (req, res) => {
  try {
    const user_id = req.user.id;
    const booking_id = req.params.id;
    
    if (!req.file) {
      return res.status(400).json({ status: 'error', message: 'File bukti pembayaran harus diunggah' });
    }

    const file_url = `/uploads/payments/${req.file.filename}`;

    const updatedBooking = await PackageModel.uploadPaymentProof(booking_id, user_id, file_url);

    if (!updatedBooking) {
      return res.status(404).json({
        status: 'error',
        message: 'Pesanan tidak ditemukan atau tidak dapat diubah'
      });
    }

    return res.status(200).json({
      status: 'success',
      message: 'Bukti pembayaran berhasil diunggah',
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
  createShipment,
  trackPackage,
  updatePackageStatus,
  getPackageHistory,
  cancelBooking,
  deleteBooking,
  updatePaymentMethod,
  uploadPaymentProof,
  checkAvailability
};
