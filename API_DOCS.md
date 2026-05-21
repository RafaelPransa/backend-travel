Dokumentasi API - Sistem Reservasi PT. Rini Trans Putri

Dokumen ini berisi panduan teknis untuk integrasi antara Backend dan Frontend.

## 🔗 Base URL

`http://localhost:3000/api`

---

## 1. Katalog Kendaraan (Public)

### A. Mengambil Semua Daftar Mobil

- **Method:** `GET`
- **Endpoint:** `/cars`
- **Deskripsi:** Menampilkan semua katalog armada yang tersedia.
- **Respon Sukses (200 OK):**
  ```json
  {
    "sukses": true,
    "pesan": "Berhasil mengambil data mobil",
    "data": [
      {
        "id": 1,
        "nama_mobil": "Isuzu Elf Long (Armada 1)",
        "tipe_mobil": "Minibus",
        "harga_per_hari": "850000.00",
        "status_ketersediaan": "Tersedia"
      }
    ]
  }
  ```

### B. Mengambil Detail Satu Mobil

- **Method:** `GET`
- **Endpoint:** `/cars/:id`
- **Deskripsi**: Menampilkan detail spesifik satu mobil berdasarkan ID.
- **Respon Sukses (200 OK):**
  ```json
  {
    "sukses": true,
    "pesan": "Berhasil mengambil data mobil",
    "data": [
      {
        "id": 1,
        "nama_mobil": "Isuzu Elf Long (Armada 1)",
        "tipe_mobil": "Minibus",
        "harga_per_hari": "850000.00",
        "status_ketersediaan": "Tersedia"
      }
    ]
  }
  ```

## 2. Transaksi Reservasi (Public)

### A. Membuat Pesanan Baru

- **Method:** `POST`
- **Endpoint:** `/bookings`
- **Deskripsi:** Mengirim data dari form pemesanan pelanggan ke database. Memiliki validasi jadwal otomatis.
- **Body Request (JSON):**
  ```json
  {
    "nama_lengkap": "Budi Santoso",
    "email": "budi.santoso@yahoo.co.id",
    "no_hp": "081234567890",
    "alamat": "Jl. Yudanegara No. 12, Tasikmalaya",
    "car_id": 1,
    "tanggal_mulai": "2026-05-25",
    "tanggal_selesai": "2026-05-27",
    "total_harga": 1700000.0
  }
  ```
- **Respon Sukses (200 OK):**
  ```json
  {
    "sukses": true,
    "pesan": "Reservasi berhasil dibuat!"
  }
  ```

## 3. Manajemen Admin (Private)

### A. Melihat Semua Riwayat Pesanan

- **Method:** `GET`
- **Endpoint:** `/bookings`
- **Deskripsi:** Deskripsi: Menampilkan semua data pesanan dengan informasi pelanggan dan detail mobil (Menggunakan JOIN).
- **Respon Sukses (200 OK):**
  ```json
  {
    "sukses": true,
    "data": [
      {
        "booking_id": 1,
        "nama_pelanggan": "Budi Santoso",
        "nama_mobil": "Isuzu Elf Long (Armada 1)",
        "tanggal_mulai": "2026-05-25",
        "status_pembayaran": "Belum Bayar"
      }
    ]
  }
  ```

### B. Memperbarui Status Pesanan

- **Method:** `PUT`
- **Endpoint:** `/bookings/:id/status`
- **Deskripsi:** Deskripsi: Mengubah status pembayaran dan reservasi.
- **Body Request (JSON):**
  ```json
  {
    "status_pembayaran": "Lunas",
    "status_reservasi": "Dikonfirmasi"
  }
  ```
