const MechanicModel = require('../models/mechanic.model');

const getFleets = async (req, res) => {
  try {
    const fleets = await MechanicModel.getFleets();
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

    const updated = await MechanicModel.updateFleetStatus(id, status);

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
    const logs = await MechanicModel.getMaintenanceLogs();
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
    const mechanicId = req.user.id;
    const { fleet_id, service_date, description, cost } = req.body;

    const log = await MechanicModel.createMaintenanceLog(mechanicId, {
      fleet_id,
      service_date,
      description,
      cost
    });

    return res.status(201).json({
      status: 'success',
      message: 'Berhasil menambahkan histori perawatan kendaraan dan mencatat pengeluaran',
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

module.exports = {
  getFleets,
  updateFleetStatus,
  getMaintenanceLogs,
  createMaintenanceLog
};
