const DashboardModel = require('../models/dashboard.model');

const getDashboardMetrics = async (req, res) => {
  try {
    // Ambil metrik ringkasan dari model
    const metrics = await DashboardModel.getDashboardData();

    // Ambil daftar armada bertugas (maksimal 2 teratas untuk dashboard utama)
    const allDuties = await DashboardModel.getActiveDutiesList();
    const active_duties = allDuties.slice(0, 2);

    return res.status(200).json({
      status: 'success',
      message: 'Berhasil mengambil metrik dasbor utama',
      data: {
        ...metrics,
        active_duties
      }
    });
  } catch (error) {
    console.error('Error getDashboardMetrics:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil metrik dasbor utama'
    });
  }
};

const getActiveDuties = async (req, res) => {
  try {
    const page = parseInt(req.query.page || 1, 10);
    const limit = parseInt(req.query.limit || 10, 10);
    const offset = (page - 1) * limit;

    const allDuties = await DashboardModel.getActiveDutiesList();
    const total = allDuties.length;
    const paginatedDuties = allDuties.slice(offset, offset + limit);
    const totalPages = Math.ceil(total / limit);

    return res.status(200).json({
      status: 'success',
      message: 'Berhasil mengambil daftar armada sedang bertugas',
      data: paginatedDuties,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error getActiveDuties:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil daftar armada sedang bertugas'
    });
  }
};

module.exports = {
  getDashboardMetrics,
  getActiveDuties
};
