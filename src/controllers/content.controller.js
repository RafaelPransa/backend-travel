const db = require('../config/db');

const getBanners = async (req, res) => {
  try {
    const banners = await db('banners').where('is_active', true).orderBy('created_at', 'desc');
    return res.status(200).json({ status: 'success', message: 'Berhasil mengambil banner promosi aktif', data: banners });
  } catch (error) {
    console.error('Error getBanners:', error);
    return res.status(500).json({ status: 'error', message: 'Gagal mengambil data banner' });
  }
};

const getDestinations = async (req, res) => {
  try {
    const destinations = await db('destinations').orderBy('created_at', 'desc');
    return res.status(200).json({ status: 'success', message: 'Berhasil mengambil rekomendasi destinasi', data: destinations });
  } catch (error) {
    console.error('Error getDestinations:', error);
    return res.status(500).json({ status: 'error', message: 'Gagal mengambil data destinasi' });
  }
};

const getPromotions = async (req, res) => {
  try {
    const promotions = await db('promotions')
      .where('is_active', true)
      .orderBy('created_at', 'desc');

    return res.status(200).json({ status: 'success', message: 'Berhasil mengambil data promosi aktif', data: promotions });
  } catch (error) {
    console.error('Error getPromotions:', error);
    return res.status(500).json({ status: 'error', message: 'Gagal mengambil data promosi' });
  }
};

const getRoutes = async (req, res) => {
  try {
    const routes = await db('routes').orderBy('origin', 'asc');
    return res.status(200).json({ status: 'success', message: 'Berhasil mengambil data rute', data: routes });
  } catch (error) {
    console.error('Error getRoutes:', error);
    return res.status(500).json({ status: 'error', message: 'Gagal mengambil data rute' });
  }
};

const getFleets = async (req, res) => {
  try {
    // Ambil semua armada agar muncul di UI, ketersediaan dinamis akan men-disable yang tidak aktif
    const allFleets = await db('fleets');

    const fleetStats = {};
    allFleets.forEach(fleet => {
      if (!fleetStats[fleet.car_type]) {
        fleetStats[fleet.car_type] = {
          car_type: fleet.car_type,
          total_units: 0,
          available_units: 0,
          base_price: fleet.price && parseFloat(fleet.price) > 0 ? parseFloat(fleet.price) : (fleet.car_type.toLowerCase() === 'elf' ? 1200000 : 800000),
          seat_capacity: fleet.seat_capacity,
          description: fleet.description,
          image_url: fleet.image_url
        };
      }
      fleetStats[fleet.car_type].total_units += 1;
      if (fleet.status === 'active') {
        fleetStats[fleet.car_type].available_units += 1;
      }
    });

    const data = Object.values(fleetStats);

    return res.status(200).json({ status: 'success', message: 'Berhasil mengambil data armada charter', data });
  } catch (error) {
    console.error('Error getFleets:', error);
    return res.status(500).json({ status: 'error', message: 'Gagal mengambil data armada charter' });
  }
};

const checkFleetsAvailability = async (req, res) => {
  try {
    const count = await db('fleets').where('status', 'active').count('id as count').first();
    const isAvailable = parseInt(count.count) > 0;
    return res.status(200).json({
      status: 'success',
      message: 'Berhasil mengecek ketersediaan armada',
      data: { available: isAvailable }
    });
  } catch (error) {
    console.error('Error checkFleetsAvailability:', error);
    return res.status(500).json({ status: 'error', message: 'Gagal mengecek armada' });
  }
};

module.exports = {
  getBanners,
  getDestinations,
  getPromotions,
  getRoutes,
  getFleets,
  checkFleetsAvailability
};
