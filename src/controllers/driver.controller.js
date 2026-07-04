const DriverModel = require('../models/driver.model');
const db = require('../config/db');

async function checkAndCompleteSchedule(schedule_id) {
  try {
    const schedule = await db('schedules').where({ id: schedule_id }).first();
    if (!schedule) return;

    // Cek penumpang yang belum selesai
    const unfinishedTravels = await db('travel_bookings')
      .where({ schedule_id })
      .whereNotIn('booking_status', ['selesai', 'dibatalkan', 'ditolak']);

    // Cek paket yang belum selesai untuk armada dan tanggal ini
    const unfinishedPackages = await db('package_shipments')
      .where({ fleet_id: schedule.fleet_id })
      .whereRaw('DATE(departure_date) = DATE(?)', [schedule.departure_time])
      .whereNotIn('status', ['delivered', 'dibatalkan', 'ditolak', 'REJECTED']);

    if (unfinishedTravels.length === 0 && unfinishedPackages.length === 0) {
      await db('schedules').where({ id: schedule_id }).update({ status: 'completed' });
      return true;
    }
    return false;
  } catch (err) {
    console.error('Error auto-completing schedule:', err);
    return false;
  }
}

const getMySchedules = async (req, res) => {
  try {
    const driver_id = req.user.id;
    const schedules = await DriverModel.getAssignedSchedules(driver_id);

    return res.status(200).json({
      status: 'success',
      message: 'Berhasil mengambil daftar tugas supir',
      data: schedules
    });
  } catch (error) {
    console.error('Error getMySchedules:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil jadwal tugas supir'
    });
  }
};

const updateScheduleStatus = async (req, res) => {
  try {
    const driver_id = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    const updated = await DriverModel.updateScheduleStatus(id, driver_id, status);

    if (!updated) {
      return res.status(404).json({
        status: 'error',
        message: 'Jadwal tidak ditemukan atau Anda tidak berwenang atas jadwal ini'
      });
    }

    return res.status(200).json({
      status: 'success',
      message: `Status perjalanan berhasil diperbarui menjadi '${status}'`,
      data: updated
    });
  } catch (error) {
    console.error('Error updateScheduleStatus:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memperbarui status perjalanan'
    });
  }
};

const updateTravelBookingStatus = async (req, res) => {
  try {
    const driver_id = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    let payment_proof_url = null;
    if (req.file) {
      payment_proof_url = `${req.protocol}://${req.get('host')}/uploads/payments/${req.file.filename}`;
    }

    const updated = await DriverModel.updateTravelBookingStatus(id, driver_id, status, payment_proof_url);

    if (!updated) {
      return res.status(404).json({
        status: 'error',
        message: 'Penumpang tidak ditemukan atau Anda tidak berwenang memperbarui status ini'
      });
    }

    let is_schedule_completed = false;
    if (['selesai', 'dibatalkan', 'ditolak'].includes(status)) {
      if (updated.schedule_id) {
        is_schedule_completed = await checkAndCompleteSchedule(updated.schedule_id);
      }
    }

    return res.status(200).json({
      status: 'success',
      message: `Status penumpang berhasil diperbarui menjadi '${status}'`,
      data: updated,
      is_schedule_completed
    });
  } catch (error) {
    console.error('Error updateTravelBookingStatus:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memperbarui status penumpang'
    });
  }
};

const updatePackageStatus = async (req, res) => {
  try {
    const driver_id = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    let payment_proof_url = null;
    if (req.file) {
      payment_proof_url = `${req.protocol}://${req.get('host')}/uploads/payments/${req.file.filename}`;
    }

    const updated = await DriverModel.updatePackageStatus(id, driver_id, status, payment_proof_url);

    if (!updated) {
      return res.status(404).json({
        status: 'error',
        message: 'Paket tidak ditemukan atau Anda tidak berwenang memperbarui status ini'
      });
    }

    let is_schedule_completed = false;
    if (['delivered', 'dibatalkan', 'ditolak', 'REJECTED'].includes(status)) {
      if (updated.fleet_id && updated.departure_date) {
        const schedule = await db('schedules')
          .where({ fleet_id: updated.fleet_id })
          .whereRaw('DATE(departure_time) = DATE(?)', [updated.departure_date])
          .first();
        if (schedule) {
          is_schedule_completed = await checkAndCompleteSchedule(schedule.id);
        }
      }
    }

    return res.status(200).json({
      status: 'success',
      message: `Status paket berhasil diperbarui menjadi '${status}'`,
      data: updated,
      is_schedule_completed
    });
  } catch (error) {
    console.error('Error updatePackageStatus:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memperbarui status paket'
    });
  }
};

const updateCharterStatus = async (req, res) => {
  try {
    const driver_id = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    let payment_proof_url = null;
    if (req.file) {
      payment_proof_url = `${req.protocol}://${req.get('host')}/uploads/payments/${req.file.filename}`;
    }

    const updated = await DriverModel.updateCharterStatus(id, driver_id, status, payment_proof_url);

    if (!updated) {
      return res.status(404).json({
        status: 'error',
        message: 'Charter tidak ditemukan atau Anda tidak berwenang memperbarui status ini'
      });
    }

    return res.status(200).json({
      status: 'success',
      message: `Status charter berhasil diperbarui menjadi '${status}'`,
      data: updated
    });
  } catch (error) {
    console.error('Error updateCharterStatus:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memperbarui status charter'
    });
  }
};

// ============================================================================
// MIGRATED FLEET & MAINTENANCE HANDLERS (FROM MECHANIC)
// ============================================================================

const getFleets = async (req, res) => {
  try {
    const fleets = await DriverModel.getFleets();
    return res.status(200).json({
      status: 'success',
      message: 'Berhasil mengambil daftar armada',
      data: fleets
    });
  } catch (error) {
    console.error('Error getFleets:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil daftar armada'
    });
  }
};

const updateFleetStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updated = await DriverModel.updateFleetStatus(id, status);

    if (!updated) {
      return res.status(404).json({
        status: 'error',
        message: 'Armada tidak ditemukan'
      });
    }

    return res.status(200).json({
      status: 'success',
      message: `Status armada berhasil diperbarui menjadi '${status}'`,
      data: updated
    });
  } catch (error) {
    console.error('Error updateFleetStatus:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memperbarui status armada'
    });
  }
};

const getMaintenanceLogs = async (req, res) => {
  try {
    const logs = await DriverModel.getMaintenanceLogs();
    return res.status(200).json({
      status: 'success',
      message: 'Berhasil mengambil daftar histori perawatan kendaraan',
      data: logs
    });
  } catch (error) {
    console.error('Error getMaintenanceLogs:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil daftar histori perawatan kendaraan'
    });
  }
};

const createMaintenanceLog = async (req, res) => {
  try {
    const driverId = req.user.id;
    const { fleet_id, service_date, description, cost } = req.body;

    let proof_image_url = null;
    if (req.file) {
      proof_image_url = `${req.protocol}://${req.get('host')}/uploads/maintenance/${req.file.filename}`;
    }

    const log = await DriverModel.createMaintenanceLog(driverId, {
      fleet_id,
      service_date,
      description,
      cost,
      proof_image_url
    });

    return res.status(201).json({
      status: 'success',
      message: 'Berhasil menambahkan histori perawatan kendaraan',
      data: log
    });
  } catch (error) {
    console.error('Error createMaintenanceLog:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal menambahkan histori perawatan kendaraan'
    });
  }
};

// ============================================================================
// OPERATIONAL EXPENSES HANDLERS
// ============================================================================

const createExpense = async (req, res) => {
  try {
    const driver_id = req.user.id;
    const { schedule_id, amount, category, description } = req.body;

    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: 'Bukti pengeluaran (foto kuitansi/struk) wajib diunggah'
      });
    }

    const proof_image_url = `${req.protocol}://${req.get('host')}/uploads/expenses/${req.file.filename}`;

    const newExpense = await DriverModel.createOperationalExpense({
      schedule_id,
      driver_id,
      amount,
      category,
      description,
      proof_image_url,
      status: 'pending'
    });

    return res.status(201).json({
      status: 'success',
      message: 'Pengajuan biaya operasional berhasil diajukan',
      data: newExpense
    });
  } catch (error) {
    console.error('Error createExpense:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengajukan biaya operasional'
    });
  }
};

const getMyExpenses = async (req, res) => {
  try {
    const driver_id = req.user.id;
    const expenses = await DriverModel.getDriverExpenses(driver_id);

    return res.status(200).json({
      status: 'success',
      message: 'Berhasil mengambil daftar pengeluaran operasional',
      data: expenses
    });
  } catch (error) {
    console.error('Error getMyExpenses:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil daftar pengeluaran operasional'
    });
  }
};

const verifyMaintenanceLog = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' atau 'rejected'

    const updated = await DriverModel.verifyMaintenanceLog(id, status);

    if (!updated) {
      return res.status(404).json({
        status: 'error',
        message: 'Laporan perbaikan kendaraan tidak ditemukan'
      });
    }

    const actionText = status === 'approved' ? 'disetujui' : 'ditolak';

    return res.status(200).json({
      status: 'success',
      message: `Laporan perbaikan kendaraan berhasil ${actionText}`,
      data: updated
    });
  } catch (error) {
    console.error('Error verifyMaintenanceLog:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal memperbarui status persetujuan laporan perbaikan kendaraan'
    });
  }
};

module.exports = {
  getMySchedules,
  updateScheduleStatus,
  updateTravelBookingStatus,
  updatePackageStatus,
  updateCharterStatus,
  getFleets,
  updateFleetStatus,
  getMaintenanceLogs,
  createMaintenanceLog,
  verifyMaintenanceLog,
  createExpense,
  getMyExpenses
};
