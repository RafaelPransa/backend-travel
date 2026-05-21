const db = require("../config/database");

// Fungsi untuk mengirimkan bookingan customer
const createBooking = async (req, res) => {
  try {
    // Menangkap data yang dikirim oleh front-end (dari form isian user)
    const {
      nama_lengkap,
      email,
      no_hp,
      alamat, // Data pelanggan
      car_id,
      tanggal_mulai,
      tanggal_selesai,
      total_harga, // Data reservasi
    } = req.body;

    // Pengecekan Cek jadwal bentrok armada
    // Mencari pesanan aktif di tanggal yang saling beririsan (overlap)
    const cekJadwalQuery = `
    SELECT id FROM bookings WHERE car_id = $1
    AND status_reservasi != 'Dibatalkan'
    AND tanggal_mulai <= $3
    AND tanggal_selesai >= $2
    `;
    const cekJadwalResult = await db.query(cekJadwalQuery, [
      car_id,
      tanggal_mulai,
      tanggal_selesai,
    ]);

    // Jika ditemukan data, berarti jadwal bentrok
    if (cekJadwalResult.rows.length > 0) {
      return res.status(400).json({
        sukses: false,
        pesan:
          "Maaf, Armada ini sudah dipesan pada tanggal tersebut. Silahkan pilih tanggal atau mobil yang lain.",
      });
    }

    // Logika penanganan pelanggan lama vs baru
    // cek apakah email sudah terdaftar di database
    const cekCustomerQuery = `SELECT id FROM customers WHERE email = $1`;
    const cekCustomerResult = await db.query(cekCustomerQuery, [email]);

    let customerId;

    if (cekCustomerResult.rows.length > 0) {
      // Skenario A: Email sudah ada (Pelanggan Lama)
      // Kita cukup mengambil ID dari data yang sudah ditemukan
      customerId = cekCustomerResult.rows[0].id;
    } else {
      // Skenario B: Email belum ada (Pelanggan Baru)
      // Kita masukkan data baru ke tabel customers dan ambil ID barunya
      // RETURNING id berfungsi agar kita langsung mendapatkan ID pelanggan yang baru saja dibuat
      const insertCustomerQuery = `
        INSERT INTO customers (nama_lengkap, email, no_hp, alamat) 
        VALUES ($1, $2, $3, $4) RETURNING id
      `;
      const insertCustomerResult = await db.query(insertCustomerQuery, [
        nama_lengkap,
        email,
        no_hp,
        alamat,
      ]);
      customerId = insertCustomerResult.rows[0].id;
    }

    // Menyimpan data pesanan ke tabel 'bookings' menggunakan ID pelanggan yg tadi
    const bookingQuery = `
    INSERT INTO bookings (customer_id, car_id, tanggal_mulai, tanggal_selesai, total_harga) VALUES ($1, $2, $3, $4, $5) RETURNING *
    `;
    const bookingResult = await db.query(bookingQuery, [
      customerId,
      car_id,
      tanggal_mulai,
      tanggal_selesai,
      total_harga,
    ]);

    // Cek status sukses
    res.status(201).json({
      sukses: true,
      pesan: "Reservasi berhasil dibuat.",
      data: bookingResult.rows[0],
    });
  } catch (error) {
    console.error("Ada masalah saat membuat reservasi:", error);

    res.status(500).json({
      sukses: false,
      pesan: "Gagal membuat reservasi. Pastikan data sudah lengkap.",
    });
  }
};

// FUNGSI ADMIN UNTUK MELIHAT SEMUA PESANAN
const getAllBookings = async (req, res) => {
  try {
    const query = `
        SELECT
            b.id AS booking_id,
            c.nama_lengkap AS nama_pelanggan,
            c.no_hp,
            mobil.nama_mobil,
            mobil.no_polisi,
            b.tanggal_mulai,
            b.tanggal_selesai,
            b.total_harga,
            b.status_pembayaran,
            b.status_reservasi
        FROM bookings b
        JOIN customers c ON b.customer_id = c.id
        JOIN cars mobil ON b.car_id = mobil.id
        ORDER BY b.created_at DESC
        `;

    const result = await db.query(query);

    res.status(200).json({
      sukses: true,
      pesan: "Berhasil mengambil semua data pesanan",
      data: result.rows,
    });
  } catch (error) {
    console.error("Ada masalah saat mengambil data pesanan:", error);
    res.status(500).json({
      sukses: false,
      pesan: "Terjadi kesalahan internal pada server",
    });
  }
};

// FUNGSI ADMIN UNTUK UPDATE STATUS PESANAN
const updateBookingStatus = async (req, res) => {
  try {
    // Menangkap ID pesanan dari URL (misal: /api/bookings/1/status)
    const bookingId = req.params.id;

    // Menangkap status baru yang dikirim oleh Admin melalui body/form
    const { status_pembayaran, status_reservasi } = req.body;

    // Perintah PostgreSQL untuk mengubah data
    const query = `
    UPDATE bookings
    SET status_pembayaran = $1, status_reservasi = $2
    WHERE id = $3
    RETURNING *
    `;

    const result = await db.query(query, [
      status_pembayaran,
      status_reservasi,
      bookingId,
    ]);

    // Jika pesanan tidak ditemukan
    if (result.rows.length === 0) {
      return res.status(404).json({
        sukses: false,
        pesan: "Pesanan tidak ditemukan:",
        error,
      });
    }

    return res.status(200).json({
      sukses: true,
      pesan: "Status pesanan berhasil diupdate",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Ada masalah saat update status:", error);
    res.status(500).json({
      status: false,
      pesan: "Terjadi kesalahan internal di database:",
      error,
    });
  }
};

module.exports = {
  createBooking,
  getAllBookings,
  updateBookingStatus,
};
