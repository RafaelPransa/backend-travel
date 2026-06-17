const DriverModel = require('../models/driver.model');

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
      message: 'Gagal mengambil jadwal tugas driver'
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
  getFleets,
  updateFleetStatus,
  getMaintenanceLogs,
  createMaintenanceLog,
  verifyMaintenanceLog,
  createExpense,
  getMyExpenses
};
