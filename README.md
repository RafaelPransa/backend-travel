# PT. Rini Trans Putri - Backend Application 🚀

Sistem Backend berbasis RESTful API untuk mengelola layanan transportasi darat modern (Travel Regular, Penyewaan Pariwisata/Charter, dan Ekspedisi/Kurir). Aplikasi ini dirancang menggunakan arsitektur modular yang melayani 4 aktor utama dengan pembagian Role-Based Access Control (RBAC) yang ketat.

---

## 👥 Aktor & Hak Akses (User Roles & ACL)

| Role | Deskripsi Hak Akses |
|---|---|
| **Customer** | Mendaftar/login secara mandiri, melihat jadwal, memesan tiket travel regular (pilih kursi dengan *seat-locking*), mengajukan sewa pariwisata (kalkulasi tarif otomatis), membuat pesanan paket, melakukan tracking pesanan, dan melihat riwayat transaksi personal. |
| **Driver (Supir)** | Login dengan akun yang dibuat oleh Admin, memantau daftar tugas perjalanan (*schedule assign*), melihat manifest penumpang dari kendaraan yang dibawa, serta mengubah status perjalanan secara real-time. |
| **Mechanic (Teknisi)** | Login dengan akun yang dibuat oleh Admin, melihat daftar armada beserta statusnya, mengubah status armada (`active` <-> `maintenance`), serta mencatat log servis kendaraan (biaya servis otomatis tercatat sebagai pengeluaran keuangan). |
| **Super Admin** | Mengelola seluruh *Master Data* (Armada, Rute, Jadwal, Driver, Customer, Mekanik, Banner Promosi, Destinasi Populer), memverifikasi bukti pembayaran sewa/travel, memasukkan pengeluaran operasional, serta melihat laporan keuangan (*cashflow* & keuntungan bersih secara otomatis). |

---

## 🎯 Fitur Utama Layanan

### 1. Travel Rute Regular (Antar Kota)
* **Ketentuan Keberangkatan Rute:**
  * **Jakarta ke Panawangan:** Hari **Senin, Rabu, dan Minggu**.
  * **Panawangan ke Jakarta:** Hari **Selasa, Kamis, dan Jumat**.
* **Interactive Seat-Locking (10 Menit):** Ketika customer memilih nomor kursi pada jadwal keberangkatan tertentu dan masuk ke alur transaksi, kursi akan dikunci selama 10 menit oleh backend untuk mencegah pemesanan ganda (*double booking*) oleh pengguna lain.
* **Driver Manifest:** Generator manifes penumpang otomatis per armada/jadwal untuk mempermudah operasional supir di lapangan.

### 2. Penyewaan Pariwisata (Charter)
* **Automated Price Calculation:** Tarif sewa dihitung secara otomatis oleh backend berdasarkan jenis kendaraan dan jumlah durasi hari sewa:
  * **Armada Luxio:** Rp1.200.000 / hari
  * **Armada Elf:** Rp1.500.000 / hari
* **Alur Transaksi & Validasi:** Mengajukan sewa -> Kalkulasi harga -> Upload bukti transfer -> Verifikasi Super Admin -> Status menjadi `'paid'`. Terdapat validasi durasi sewa minimum 1 hari, dan penolakan otomatis jika tanggal pulang mendahului tanggal berangkat.

### 3. Layanan Antar Paket (Courier)
* **Resi Otomatis (Waybill):** Generator nomor resi acak berbasis kriptografi (non-incremental) untuk menjaga kerahasiaan volume transaksi perusahaan.
* **Tracking Berbasis Status:** Pelacakan status paket secara publik tanpa harus login menggunakan nomor resi.

### 4. Manajemen Perawatan & Bengkel (Mechanic Module)
* **Fleet Status Control:** Mengubah status armada antara `active` (siap jalan) dan `maintenance` (sedang diservis).
* **Automated Cashflow Integration:** Setiap penginputan log perawatan armada oleh teknisi (meliputi biaya servis, sparepart, dll.) akan otomatis tercatat sebagai pengeluaran keuangan (`cashflows` dengan kategori `'service'`) pada sistem keuangan Super Admin.

### 5. Super Admin Dashboard & Laporan Keuangan
* **Financial Bookkeeping:** Kalkulasi otomatis laporan keuangan (*Cashflow Summary*) untuk menghasilkan total pemasukan, pengeluaran (bensin, tol, servis), serta laba bersih (*Net Profit*) secara real-time.

---

## 🛠️ Tech Stack & Arsitektur

* **Runtime Environment:** Node.js
* **Framework:** Express.js (RESTful API)
* **Database:** PostgreSQL (Dioperasikan melalui Laragon atau Docker di lokal)
* **Query Builder:** [Knex.js](https://knexjs.org/) (Menggunakan sistem Migrasi & Seeder untuk konsistensi skema)
* **Skema & Validasi Input:** Zod (Memvalidasi seluruh request body secara ketat sebelum diproses oleh Controller)
* **Keamanan (Security):**
  * JSON Web Token (JWT) dengan skema Bearer Token untuk otorisasi endpoint.
  * BcryptJS untuk hashing password pengguna.
  * Helmet.js untuk pengamanan HTTP Headers.
  * CORS (Cross-Origin Resource Sharing) yang terkonfigurasi.
* **Struktur Folder (Modular):**
  ```
  src/
  ├── config/         # Konfigurasi database & pihak ketiga
  ├── controllers/    # Logika penanganan request & response
  ├── db/             # Berisi file Migrations & Seeds dari Knex
  ├── middlewares/    # Middleware autentikasi, otorisasi, & validasi
  ├── models/         # Abstraksi query database (Knex)
  └── routes/         # Definisi endpoint API berdasarkan modul
  ```

---

## 🚀 Panduan Instalasi & Menjalankan Aplikasi

### 1. Prasyarat
Pastikan mesin Anda telah terinstal:
* **Node.js** (Versi 16 atau yang lebih baru)
* **PostgreSQL** atau **Laragon** (Jika Anda menggunakan Windows)

### 2. Kloning Repositori
```bash
git clone https://github.com/RafaelPransa/backend-travel.git
cd backend-travel
```

### 3. Instalasi Dependensi
```bash
npm install
```

### 4. Konfigurasi Environment & Database Switcher
Buat duplikasi template `.env.example` ke file `.env`:
```bash
cp .env.example .env
```

Untuk mempermudah perpindahan koneksi database antara **Localhost (Lokal)** dan **Supabase (Cloud)**, gunakan perintah npm script berikut:

* **Beralih ke Database Lokal (Localhost):**
  ```bash
  npm run env:local
  ```
  *(Pastikan kredensial di file `.env.local` sudah disesuaikan dengan database lokal Anda)*

* **Beralih ke Database Cloud (Supabase):**
  ```bash
  npm run env:supabase
  ```
  *(Pastikan kredensial di file `.env.supabase` sudah terisi dengan benar)*

> [!TIP]
> **Khusus Pengguna Windows PowerShell:**
> Jika PowerShell membatasi eksekusi skrip, jalankan dengan menambahkan awalan `cmd /c`:
> * `cmd /c npm run env:local`
> * `cmd /c npm run env:supabase`

### 5. Inisiasi Database (Migrasi & Seeder)
Sistem ini menggunakan Knex untuk membuat tabel secara otomatis beserta data percobaan awal (Super Admin, Supir, Mekanik, Rute, dan Armada).
```bash
# Jalankan migrasi untuk membuat tabel
npx knex migrate:latest

# Jalankan seeder untuk mengisi data awal (dummy data)
npx knex seed:run
```

### 6. Menjalankan Server (Development Mode)
```bash
npm run dev
```
Server akan aktif dan berjalan di `http://localhost:5000` (atau port yang didefinisikan dalam `.env`).

---

## 📚 Dokumentasi API

Sistem ini menyediakan dua jenis dokumentasi API untuk mempermudah integrasi:

### 1. Swagger UI (Dokumentasi Interaktif - Direkomendasikan 🚀)
Dokumentasi interaktif dapat diakses langsung melalui browser saat server backend berjalan. Anda dapat menguji seluruh endpoint secara langsung (*Try it out*) serta melakukan otentikasi JWT Bearer token secara *real-time*.

* **URL Akses:** `http://localhost:5000/api-docs` *(sesuaikan port dengan variabel `PORT` di berkas `.env` Anda)*.
* **Fitur Utama:**
  * Skema parameter & body terintegrasi langsung dengan skema validasi **Zod** di backend (selalu singkron).
  * Simulasi header otentikasi menggunakan tombol **Authorize**.

### 2. Berkas Markdown (Statis)
Daftar endpoint, parameter, dan contoh response mentah juga tercatat secara lengkap pada berkas `api_documentation.md` yang dapat diimpor secara manual ke aplikasi API client seperti Postman atau Bruno.
