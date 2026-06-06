const db = require('../config/db');

const getTableData = async (table) => {
  return db(table).select('*').orderBy('created_at', 'desc');
};

const getById = async (table, id) => {
  return db(table).where({ id }).first();
};

const createRecord = async (table, data) => {
  const [record] = await db(table).insert(data).returning('*');
  return record;
};

const updateRecord = async (table, id, data) => {
  const [record] = await db(table).where({ id }).update(data).returning('*');
  return record;
};

const deleteRecord = async (table, id) => {
  return db(table).where({ id }).del();
};

module.exports = {
  getTableData,
  getById,
  createRecord,
  updateRecord,
  deleteRecord
};
