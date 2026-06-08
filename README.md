# PT. Rini Trans Putri - Backend Application

Sistem Backend untuk mengelola layanan transportasi darat modern (Travel, Pariwisata, dan Ekspedisi). Aplikasi ini dirancang menggunakan arsitektur modular yang melayani 3 aktor utama: **Customer**, **Driver**, dan **Super Admin**.

---

## 🎯 Fitur Utama Layanan

Sistem backend ini menaungi tiga pilar bisnis utama perusahaan:
1. **Travel Regular (Antar Kota)**
   * Sistem jadwal keberangkatan (*Schedules*).
   * Pemesanan tiket (*Booking*) dengan kapabilitas *Seat-Locking* interaktif selama 10 menit untuk mencegah pemesanan ganda.
   * Pencetakan *Driver Manifest* (daftar penumpang otomatis untuk supir).

2. **Penyewaan Pariwisata (Charter)**
   * Kalkulasi harga dinamis secara otomatis (*Automated Price Calculation*) berdasarkan jenis armada (Luxio/Elf) dan durasi hari penyewaan.
   * Riwayat penyewaan untuk dikelola dan diverifikasi pembayarannya oleh Super Admin.

3. **Layanan Antar Paket (Courier)**
   * Generator Nomor Resi otomatis berbasis UUID pendek (*Cryptography*) untuk kerahasiaan *waybill*.
   * Sistem *Public Tracking* tanpa harus login.

4. **Super Admin Dashboard (Manajemen Terpusat)**
   * Operasi *CRUD* untuk *Master Data* (Armada, Rute, Akun, Jadwal, Banner Promosi, Destinasi Populer).
   * Menugaskan (*Assign*) Supir dan Mobil ke Jadwal keberangkatan.
   * Pembukuan Finansial (*Cashflow Summary*) otomatis menghitung *Net Profit* berdasarkan pendapatan transaksi dan *expense* (bensin, servis, tol).

5. **Driver Area (Operasional Lapangan)**
   * Supir dapat melihat daftar tugas perjalanan miliknya sekaligus data detail manifest penumpangnya.
   * *One-click status update* (misal dari *Scheduled* -> *Boarding* -> *Driving* -> *Completed*).

---

## 🛠️ Tech Stack

Proyek ini dibangun di atas pondasi ekosistem Node.js dengan teknologi inti berikut:
* **Framework:** [Express.js](https://expressjs.com/)
* **Database:** PostgreSQL (Dioperasikan via Laragon/Docker)
* **Query Builder:** [Knex.js](https://knexjs.org/)
* **Validasi Skema:** [Zod](https://zod.dev/)
* **Keamanan:** JSON Web Token (JWT) untuk Otorisasi, BcryptJS untuk enkripsi *password*.

---

## 🚀 Panduan Instalasi & Menjalankan Aplikasi

Ikuti instruksi berikut untuk menjalankan server secara lokal.

### 1. Prasyarat
Pastikan mesin Anda telah menginstal:
* [Node.js](https://nodejs.org/en/) (Versi 16 atau yang lebih baru)
* [PostgreSQL](https://www.postgresql.org/) atau [Laragon](https://laragon.org/) (Jika menggunakan Windows).

### 2. Kloning Repositori
```bash
git clone https://github.com/RafaelPransa/backend-travel.git
cd backend-travel
```

### 3. Instalasi Dependensi
```bash
npm install
```

### 4. Konfigurasi Environment (Variabel Lingkungan)
Salin file konfigurasi bawaan dan sesuaikan kredensial koneksi *database* Anda.
```bash
cp .env.example .env
```

Untuk mempermudah perpindahan koneksi database antara **Localhost (Lokal)** dan **Supabase (Cloud)**, gunakan perintah berikut:

* **Beralih ke Database Lokal (Localhost):**
  ```bash
  npm run env:local
  ```
  *(Pastikan kredensial di file `.env.local` sudah disesuaikan dengan DB lokal Anda)*

* **Beralih ke Database Cloud (Supabase):**
  ```bash
  npm run env:supabase
  ```
  *(Pastikan kredensial di file `.env.supabase` sudah sesuai)*

*(Catatan: Jika menggunakan Windows PowerShell dan mengalami kendala Execution Policy, Anda bisa menggunakan `cmd /c npm run env:local` atau `cmd /c npm run env:supabase`)*


### 5. Inisiasi Database (Migrasi & Seeder)
Sistem ini memfasilitasi pembuatan tabel otomatis beserta data percobaan awal (1 Super Admin, 2 Supir, 2 Armada, dan 2 Rute).
```bash
# Mengeksekusi tabel database (Migrasi)
npx knex migrate:latest

# Menginjeksi data awal (Seeder)
npx knex seed:run
```

### 6. Menjalankan Server (Development Mode)
```bash
npm run dev
```
Server akan berjalan di `http://localhost:5000` (atau *port* yang ditentukan di `.env`).

---

## 📚 Dokumentasi API
Daftar seluruh *endpoint* REST API, dari metode otentikasi hingga pengelolaan *Super Admin*, sudah didokumentasikan di file `api_documentation.md` (Tersedia untuk langsung di-impor / di-*copy* ke dalam **Postman Collection**).
