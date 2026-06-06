# Product Requirement Document (PRD) - Backend API
## Proyek: Sistem Informasi Promosi & Reservasi PT. Rini Trans Putri
**Status:** MVP (Minimum Viable Product) untuk Kerja Praktik

---

## 1. Ringkasan Proyek (Project Overview)
Aplikasi ini adalah sistem backend berbasis API untuk mengelola tiga layanan utama PT. Rini Trans Putri di wilayah Priangan Timur:
1. **Travel Rute Regular** (Ciamis - Jakarta PP)
2. **Booking Travel** (Sewa/Charter/Pariwisata)
3. **Pengiriman Paket** (Ekspedisi/Kurir)

Sistem ini berfokus pada penyediaan RESTful API yang aman, terstruktur, dan siap dikonsumsi oleh aplikasi frontend (Web/Mobile).

---

## 2. Tech Stack & Arsitektur (Strict Rules)
* **Runtime:** Node.js
* **Framework:** Express.js (RESTful API)
* **Database:** PostgreSQL (berjalan di Laragon)
* **SQL Builder:** Knex.js (Wajib menggunakan Migrations dan Seeds)
* **Autentikasi:** JWT (JSON Web Token) dengan skema Bearer Token
* **Keamanan:** Bcryptjs (hashing password), Helmet, CORS
* **Validasi Input:** Zod / Joi (Semua request body wajib divalidasi sebelum masuk ke Controller/Database)
* **Arsitektur Folder:** Modular (Routes -> Middlewares -> Controllers -> Models/Query Knex)

---

## 3. Cakupan Pengguna & Hak Akses (User Roles & ACL)

Sistem wajib memisahkan hak akses menggunakan Role-Based Access Control (RBAC) secara ketat:

### A. Customer (Pelanggan)
* Mendaftar akun dan login.
* Melihat jadwal travel rute yang tersedia.
* Melakukan reservasi tiket travel rute (memilih nomor kursi).
* Mengajukan booking travel pariwisata/charter.
* Membuat pesanan pengiriman paket.
* Melakukan tracking status pesanan (Travel, Booking, Paket).
* Melihat riwayat transaksi pribadi.

### B. Driver / Supir (Admin Lapangan)
* Login ke sistem (tidak ada opsi daftar mandiri, akun dibuatkan oleh Super Admin).
* Melihat daftar tugas/jadwal jalan yang diberikan (Mobil, rute, alamat penjemputan, dan daftar manifest penumpang).
* Mengubah status perjalanan (Contoh: `Menuju Penjemputan` -> `Dalam Perjalanan` -> `Selesai`).
* *Catatan:* Tarif paket ditunda/tidak diubah oleh supir.

### C. Super Admin (Manajemen/Pemilik)
* Mengelola (CRUD) Master Data: Armada/Mobil, Rute, Jadwal Keberangkatan, Akun Driver, dan Akun Customer.
* Memasukkan data pengeluaran operasional (Bensin, tol, servis) atau menyetujui laporan.
* Memantau ringkasan laporan keuangan (Total pemasukan dari 3 layanan & total pengeluaran).
* Menetapkan (Assign) Driver dan Armada ke suatu Jadwal Keberangkatan.
* Mengelola konten dinamis website: Banner promosi dan Destinasi Populer.

---

## 4. Fitur Utama & Alur Logika (MVP Scope)

### Layanan 1: Travel Rute (Regular Shuttles)
* **Seat Locking Mechanism:** Saat Customer memilih kursi dan masuk ke proses pembayaran, backend wajib mengunci (lock) nomor kursi tersebut selama 10 menit agar tidak terjadi *double booking* oleh user lain pada jadwal yang sama.
* **Manifest:** Backend harus bisa menyajikan data manifest penumpang per mobil untuk dibaca oleh Driver.

### Layanan 2: Booking Travel (Charters/Pariwisata)
* **Automated Price Calculation:** Sistem menghitung total biaya sewa secara otomatis di backend saat Customer melakukan pemesanan berdasarkan durasi hari dan jenis armada.
* **Aturan Tarif Resmi:**
  * Armada `Luxio` = Rp1.200.000 / hari
  * Armada `Elf` = Rp1.500.000 / hari
* **Alur Logika Transaksi:** `Customer input order (Jenis Mobil, Tanggal Berangkat, Tanggal Pulang)` -> `Backend menghitung: (Total Hari) x Harga Per Hari` -> `Pesanan disimpan dengan kolom offered_price terisi otomatis dan Status: pending` -> `Customer upload bukti transfer` -> `Super Admin melakukan verifikasi` -> `Status: paid`.
* **Validasi Durasi:** Perhitungan hari minimal adalah 1 hari jika tanggal berangkat dan pulang di hari yang sama. Jika tanggal pulang mendahului tanggal berangkat, backend wajib menolak request (Error 400).

### Layanan 3: Antar Paket (Courier)
* **Resi Otomatis (Waybill):** Backend wajib men-generate nomor resi unik secara otomatis saat pesanan paket dibuat menggunakan format acak/non-incremental (Contoh: `RTP-2026XXXXX` atau menggunakan NanoID/UUID pendek) untuk menjaga kerahasiaan volume transaksi.
* **Tracking Berbasis Status:** Tracking dilakukan manual berdasarkan perubahan status yang diperbarui di sistem (Belum menggunakan koordinat GPS real-time).

---

## 5. Batasan Proyek (Out of Scope - DILARANG DIBUAT)
Agar sesi *vibe coding* tidak melantur, fitur berikut **TIDAK BOLEH** dibuat pada fase ini:
* **Payment Gateway Otomatis:** Pembayaran saat ini disimulasikan menggunakan upload bukti transfer manual (konfirmasi oleh Super Admin) atau bayar di tempat (COD/Cash).
* **Live GPS Tracking:** Tracking posisi supir di peta tidak perlu dibuat. Cukup tracking berbasis perubahan status logik di database.
* **Kalkulator Tarif Paket Otomatis:** Perhitungan tarif berdasarkan berat/volume ditunda sampai data dari perusahaan didapatkan.

---

## 6. Rencana Endpoint API Utama (Initial Route Map)

### /api/auth
* `POST /register` (Customer saja)
* `POST /login` (Semua role, mengembalikan token + info role)

### /api/users (Super Admin Only)
* `GET /drivers` & `POST /drivers` (Manajemen akun supir)

### /api/travel (Rute Regular)
* `GET /schedules` (Filter by tanggal, rute)
* `POST /bookings` (Customer: Pesan tiket & pilih kursi)
* `GET /manifest/:schedule_id` (Driver & Admin: Lihat penumpang)

### /api/bookings (Pariwisata)
* `POST /api/charter/request` (Customer: Ajukan sewa + auto kalkulasi harga)
* `GET /api/charter/history` (Customer: Lihat riwayat personal | Super Admin: Lihat semua pengajuan sewa)
* `PUT /api/charter/:id/verify` (Super Admin: Verifikasi bukti pembayaran dan ubah status menjadi 'paid')

### /api/packages (Antar Paket)
* `POST /shipments` (Customer: Buat pengiriman, generate resi)
* `GET /track/:resi_number` (Public/Customer: Cek status paket)
* `PUT /shipments/:id/status` (Super Admin/Driver: Update status paket)