# PT. Rini Trans Putri - Backend Application 🚀

Sistem Backend berbasis RESTful API untuk mengelola layanan transportasi darat modern (Travel Regular, Penyewaan Pariwisata/Charter, dan Ekspedisi/Kurir). Aplikasi ini dirancang untuk sistem akademik/kerja praktik, menyediakan layanan backend lengkap dari pemesanan hingga pencatatan laporan keuangan terotomatisasi.

---

## 👥 Aktor & Hak Akses (User Roles & ACL)

Aplikasi diakses oleh 3 jenis role utama dengan *Role-Based Access Control* (RBAC) yang ketat:

1. **Customer**: Mendaftar/login secara mandiri, melihat jadwal, memesan tiket travel regular (pilih kursi dengan *seat-locking*), mengajukan sewa pariwisata (kalkulasi tarif otomatis), membuat pesanan paket, dan melihat riwayat transaksi personal.
2. **Driver (Supir)**: Login dengan akun yang dibuat oleh Admin. Memiliki wewenang untuk memantau daftar tugas perjalanan (*schedule assign*), melihat manifest penumpang, mengubah status perjalanan secara real-time, **melaporkan histori perawatan armada (maintenance)**, dan **mengajukan biaya operasional** harian (seperti bensin & tol).
3. **Super Admin**: Mengelola seluruh *Master Data* (Armada, Rute, Jadwal, Driver, Customer, Banner Promosi, Destinasi Populer), memverifikasi bukti pembayaran dari pelanggan, menyetujui (approve) pengajuan biaya operasional supir, serta memonitor laporan keuangan (*cashflow* & *Net Profit* otomatis).

---

## 🛠️ Arsitektur & Struktur File

Aplikasi ini menggunakan pola arsitektur **Modular Component-based**. Memisahkan fungsi rute, validasi, logika bisnis, dan interaksi database ke dalam direktori terpisah.

### Struktur Folder
```text
backend-kerjapraktik/
├── src/
│   ├── config/         # Konfigurasi koneksi database & library pihak ketiga (Swagger, DB Knex)
│   ├── controllers/    # Logika bisnis penanganan HTTP request & pengiriman response
│   ├── db/             # Berisi file Migrations & Seeds dari Knex (Definisi Skema DB & Data Dummy)
│   ├── middlewares/    # Middleware autentikasi (JWT), otorisasi role, validasi input, & Upload
│   ├── models/         # Abstraksi query database relasional menggunakan Knex
│   ├── routes/         # Definisi routing endpoint API ke controller masing-masing
│   └── app.js          # Entry point utama inisiasi server Express
├── uploads/            # Direktori penyimpanan file lokal (bukti payment, expenses, maintenance)
├── package.json        # Manifest dependensi project
└── README.md
```

### Konvensi Penamaan File (Dot Case / Dot Notation)
Aplikasi ini secara seragam mengadopsi format **Dot Notation** pada penamaan file, misalnya `user.controller.js`, `driver.model.js`, `auth.routes.js`.
* **Kelebihan Dukungan OS:** Mengamankan proses *deployment*. Server Linux memiliki file system yang bersifat *case-sensitive*, sementara Windows tidak. Menghindari `CamelCase` (seperti `userController.js`) akan menghapus potensi error ketika di-deploy ke production server.
* **Keterbacaan:** Memberikan pembatas visual yang jelas untuk mengidentifikasi peran sebuah file.
* **Organisasi & Pencarian:** Sangat memudahkan pencarian global di teks editor karena kita dapat menfilter spesifik `*.controller.js`.

---

## 🔌 API yang Tersedia (Available APIs)

Aplikasi mengekspos puluhan RESTful API. Secara garis besar dikelompokkan ke dalam modul:

* **Auth API** (`/api/auth`): Mengelola Pendaftaran (Register) dan Login token JWT.
* **Master Data API** (`/api/master`): Endpoint CRUD untuk data inti rute, armada, jadwal, & destinasi.
* **User API** (`/api/users`): Manajemen akun pengguna oleh Super Admin.
* **Driver API** (`/api/driver`): Endpoint interaktif untuk supir melihat penugasan manifest penumpang, input log perbaikan bengkel, dan pengajuan bon operasional perjalanan.
* **Travel API** (`/api/travel`): Pemesanan tiket antar kota dengan fungsionalitas kursi dan alamat *door-to-door*.
* **Charter API** (`/api/charter`): Layanan sewa armada eksklusif dengan tarif terkomputasi harian.
* **Package API** (`/api/package`): Pengiriman barang.
* **Cashflow API** (`/api/cashflow`): Endpoint Dashboard akuntansi untuk menghitung *Gross Profit* dan *Net Profit* berdasarkan waktu (harian/mingguan/tahunan).

> 💡 **Dokumentasi Spesifik & Interaktif**
> Penjelasan *body request* JSON, status code, dan pengujian API secara langsung dapat dilakukan melalui **Swagger UI** yang telah tertanam di dalam aplikasi.

---

## 🗄️ Skema Database Utama

Aplikasi menggunakan **PostgreSQL** yang dikelola melalui Knex Migrations. Berikut adalah tabel relasional yang digunakan:

1. `users`: Menyimpan kredensial autentikasi (email, password yang di-hash) dan peran otoritas (*role*).
2. `fleets`: Data inventori kendaraan perusahaan (tipe mobil, plat, kapasitas kursi, status mesin).
3. `routes`: Jalur transportasi (titik awal & akhir) beserta tarif dasar.
4. `schedules`: Penjadwalan harian yang merelasikan rute, kendaraan (`fleet_id`), dan pengemudi (`driver_id`).
5. `travel_bookings`, `charter_bookings`, `package_bookings`: Menyimpan data pesanan spesifik yang merujuk pada jadwal atau pelanggan.
6. `payments`: Memisahkan tabel mutasi status pembayaran dari tabel booking, digunakan untuk menyimpan status validasi dan nama file bukti transfer.
7. `operational_expenses`: Mewadahi ajuan biaya harian dari supir per jadwal perjalanan (bensin, tol) yang memiliki status approval.
8. `maintenance_logs`: Riwayat masuk bengkel dan penggantian suku cadang oleh supir/mekanik.
9. `cashflows`: Tabel *ledger* (buku besar) pencatatan arus masuk-keluar uang. Diisi secara otomatis melalui sistem *trigger* aplikasi saat ada pemesanan yang disetujui atau klaim supir/mekanik dicairkan.

---

## 💻 Tech Stack & Library

* **Runtime Environment:** Node.js (V8 Engine)
* **Web Framework:** Express.js 5.x (API Web Server)
* **Database:** PostgreSQL
* **Query Builder:** Knex.js (Menyediakan fitur Query Builder, Database Migrations, & Seeders)

**Library Pihak Ketiga Inti:**
* **`zod`**: Skema validasi request body yang kuat untuk mencegah Payload API korup/DDoS sederhana.
* **`bcryptjs`**: Keamanan kriptografi hashing untuk password pengguna di database.
* **`jsonwebtoken` (JWT)**: Manajemen *stateless session* dan autorisasi Bearer token.
* **`multer`**: Penanganan form multipart dan upload penyimpanan file foto (struk, slip gaji, dsb).
* **`swagger-ui-express` & `swagger-jsdoc`**: Menghasilkan portal dokumentasi Swagger secara real-time berdasarkan kode sumber (JSDoc annotations).
* **`cors` & `helmet`**: Modul mitigasi keamanan header HTTP dan akses origin browser (CORS).
* **`dotenv`**: Variabel lingkungan konfigurasi.

---

## 🚀 Panduan Instalasi & Menjalankan Aplikasi (Localhost)

Karena berstatus lingkungan pengembangan lokal (*Development*), silakan ikuti petunjuk berikut untuk menginisiasi aplikasi:

### 1. Prasyarat Sistem
* **Node.js** (Versi 16+)
* **PostgreSQL** lokal yang sedang berjalan aktif (Bisa menggunakan PostgreSQL native, Docker, atau Laragon Windows).

### 2. Kloning Repositori & Instalasi Dependensi
```bash
git clone https://github.com/RafaelPransa/backend-travel.git
cd backend-travel
npm install
```

### 3. Konfigurasi Environment (Lingkungan)
Duplikasikan file template konfigurasi dan atur kredensial database Anda.
```bash
cp .env.example .env
```
Buka file `.env` dengan teks editor dan atur detail database lokal (PostgreSQL) Anda:
```env
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASS=password_database_anda
DB_NAME=rini_trans_db
JWT_SECRET=rahasia_jwt_key_terserah_anda
```

### 4. Setup Database (Migrasi & Seeder Knex)
Pastikan Anda sudah membuat database bernama `rini_trans_db` di PostgreSQL Anda. Setelah itu, jalankan perintah di bawah ini untuk membuat seluruh kerangka tabel dan menyuntikkan data dummy awal (admin, armada, jadwal):
```bash
npx knex migrate:latest
npx knex seed:run
```

### 5. Menjalankan Server
Gunakan perintah mode pengembang (memiliki *hot-reload* saat mengedit file):
```bash
npm run dev
```
Server backend akan mulai mendengarkan port. 

### 6. Mengakses Halaman Swagger (Dokumentasi API)
Buka browser Anda dan navigasikan ke alamat berikut untuk mengetes interaksi setiap API yang ada:
👉 `http://localhost:5000/api-docs`
