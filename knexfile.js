require('dotenv').config();

// Cek apakah database host bukan localhost untuk mengaktifkan SSL secara otomatis
const useSSL = process.env.DB_HOST && 
               process.env.DB_HOST !== 'localhost' && 
               process.env.DB_HOST !== '127.0.0.1';

module.exports = {
  development: {
    client: process.env.DB_CLIENT || 'pg',
    connection: {
      host: process.env.DB_HOST || '127.0.0.1',
      port: process.env.DB_PORT || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'rini_trans_db',
      ssl: useSSL ? { rejectUnauthorized: false } : false
    },
    migrations: {
      directory: './src/db/migrations'
    },
    seeds: {
      directory: './src/db/seeds'
    }
  }
};
