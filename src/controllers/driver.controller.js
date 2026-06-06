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

module.exports = {
  getMySchedules,
  updateScheduleStatus
};
