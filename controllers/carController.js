// Memanggil koneksi database yang sudah kita buat
const db = require("../config/database");

// Fungsi untuk mengambil semua data mobil
const getAllCars = async (req, res) => {
  try {
    // Menjalankan perintah SQL (sama persis seperti di DBeaver)
    const result = await db.query("SELECT * FROM cars ORDER BY id ASC");

    // Mengirimkan hasil balasan ke front-end dalam format JSON
    res.status(200).json({
      sukses: true,
      pesan: "Berhasil mengambil data mobil",
      data: result.rows,
    });
  } catch (error) {
    console.error("Ada masalah saat mengambil data mobil:", error);
    res.status(500).json({
      sukses: false,
      pesan: "Terjadi kesalahan pada server",
    });
  }
};

const getCarById = async (req, res) => {
  try {
    // Menangkap angka ID dari URL (misal angka 1 dari /api/cars/1)
    const idMobil = req.params.id;

    // Menjalankan SQL. Tanda $1 adalah keamanan untuk mencegah di-hack (SQL Injection)
    const result = await db.query("SELECT * FROM cars WHERE id = $1", [
      idMobil,
    ]);

    // Jika mobil dengan ID tersebut tidak ditemukan di database

    if (result.rows.length === 0) {
      return res.status(404).json({
        sukses: false,
        pesan: "Mobil tidak ditemukan.",
      });
    }
    return res.status(200).json({
      sukses: true,
      pesan: "Mobil ditemukan.",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Ada masalah:", error);
    res.status(500).json({
      sukses: false,
      pesan: "Terdapat kesalahan di server.",
    });
  }
};

// Mengekspor fungsi agar bisa dipakai di file Route
module.exports = {
  getAllCars,
  getCarById,
};
