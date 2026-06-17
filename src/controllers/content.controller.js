const db = require('../config/db');

const getBanners = async (req, res) => {
  try {
    const banners = await db('banners')
      .where('is_active', true)
      .orderBy('created_at', 'desc');
    
    return res.status(200).json({
      status: 'success',
      message: 'Berhasil mengambil banner promosi aktif',
      data: banners
    });
  } catch (error) {
    console.error('Error getBanners:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data banner'
    });
  }
};

const getDestinations = async (req, res) => {
  try {
    const destinations = await db('destinations')
      .orderBy('created_at', 'desc');
      
    return res.status(200).json({
      status: 'success',
      message: 'Berhasil mengambil rekomendasi destinasi',
      data: destinations
    });
  } catch (error) {
    console.error('Error getDestinations:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data destinasi'
    });
  }
};

const getPromotions = async (req, res) => {
  try {
    const { type } = req.query;
    
    let query = db('promotions').where('is_active', true);
    
    if (type === 'home') {
      query = query.whereIn('promo_type', ['home', 'all']);
    } else if (type === 'service') {
      query = query.whereIn('promo_type', ['service', 'all']);
    } else if (type === 'all') {
      query = query.where('promo_type', 'all');
    }
    
    const promotions = await query.orderBy('created_at', 'desc');
    
    return res.status(200).json({
      status: 'success',
      message: 'Berhasil mengambil data promosi aktif',
      data: promotions
    });
  } catch (error) {
    console.error('Error getPromotions:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data promosi'
    });
  }
};

module.exports = {
  getBanners,
  getDestinations,
  getPromotions
};
