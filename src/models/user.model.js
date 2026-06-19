const db = require('../config/db');

const findByEmail = async (email) => {
  return db('users').where({ email }).first();
};

const findById = async (id) => {
  return db('users').where({ id }).first();
};

const create = async (userData) => {
  const [user] = await db('users').insert(userData).returning(['id', 'name', 'email', 'role', 'phone_number']);
  return user;
};

module.exports = {
  findByEmail,
  findById,
  create
};
