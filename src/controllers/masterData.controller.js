const MasterDataModel = require('../models/masterData.model');
const bcrypt = require('bcryptjs');

// Generic CRUD handlers
const getRecords = (table) => async (req, res) => {
  try {
    const records = await MasterDataModel.getTableData(table);
    return res.status(200).json({ status: 'success', data: records });
  } catch (error) {
    console.error(`Error getRecords ${table}:`, error);
    return res.status(500).json({ status: 'error', message: 'Terjadi kesalahan server' });
  }
};

const createRecord = (table) => async (req, res) => {
  try {
    const data = req.body;
    
    // Khusus tabel users, hash password
    if (table === 'users' && data.password) {
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(data.password, salt);
    }

    const newRecord = await MasterDataModel.createRecord(table, data);
    return res.status(201).json({ status: 'success', message: 'Data berhasil ditambahkan', data: newRecord });
  } catch (error) {
    console.error(`Error createRecord ${table}:`, error);
    return res.status(500).json({ status: 'error', message: 'Gagal menambah data' });
  }
};

const updateRecord = (table) => async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    if (table === 'users' && data.password) {
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(data.password, salt);
    }

    const updated = await MasterDataModel.updateRecord(table, id, data);
    if (!updated) {
      return res.status(404).json({ status: 'error', message: 'Data tidak ditemukan' });
    }
    return res.status(200).json({ status: 'success', message: 'Data berhasil diubah', data: updated });
  } catch (error) {
    console.error(`Error updateRecord ${table}:`, error);
    return res.status(500).json({ status: 'error', message: 'Gagal mengubah data' });
  }
};

const deleteRecord = (table) => async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await MasterDataModel.deleteRecord(table, id);
    if (!deleted) {
      return res.status(404).json({ status: 'error', message: 'Data tidak ditemukan' });
    }
    return res.status(200).json({ status: 'success', message: 'Data berhasil dihapus' });
  } catch (error) {
    console.error(`Error deleteRecord ${table}:`, error);
    return res.status(500).json({ status: 'error', message: 'Gagal menghapus data. Kemungkinan data ini sedang terpakai (Constraint Foreign Key)' });
  }
};

// Khusus Assign Schedule
const assignSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { fleet_id, driver_id } = req.body;
    
    const updated = await MasterDataModel.updateRecord('schedules', id, { fleet_id, driver_id });
    if (!updated) {
      return res.status(404).json({ status: 'error', message: 'Jadwal tidak ditemukan' });
    }
    return res.status(200).json({ status: 'success', message: 'Berhasil menugaskan armada dan driver', data: updated });
  } catch (error) {
    console.error('Error assignSchedule:', error);
    return res.status(500).json({ status: 'error', message: 'Gagal menugaskan driver' });
  }
};

module.exports = {
  getRecords,
  createRecord,
  updateRecord,
  deleteRecord,
  assignSchedule
};
