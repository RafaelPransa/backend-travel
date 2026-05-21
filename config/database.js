const { Pool } = require("pg");
require("dotenv").config(); // Memanggil data dari file .env

// Membuat pengaturan koneksi
const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

// Mengetes koneksi
pool.connect((err, client, release) => {
  if (err) {
    return console.error("Gagal terkoneksi ke database:", err.stack);
  }
  console.log("Berhasil terkoneksi ke PostgreSQL!");
  release(); // Melepaskan koneksi setelah sukses dites
});

module.exports = pool;
