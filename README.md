# PT. Rini Trans Putri - Backend API Service 🚀

[![Node.js Version](https://img.shields.io/badge/node.js-%3E%3D16.0.0-brightgreen.svg?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Express Version](https://img.shields.io/badge/express-5.x-blue.svg?style=flat-square&logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/postgresql-14%2B-blue.svg?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Knex.js](https://img.shields.io/badge/knex.js-3.x-orange.svg?style=flat-square)](https://knexjs.org/)
[![Swagger Documentation](https://img.shields.io/badge/swagger-100%25%20compliant-brightgreen.svg?style=flat-square&logo=swagger)](http://localhost:5000/api-docs)

Sistem Backend berbasis RESTful API berkinerja tinggi untuk mengelola ekosistem layanan transportasi darat modern (Travel Regular, Penyewaan Pariwisata/Charter, dan Ekspedisi/Kurir). Aplikasi dirancang secara komprehensif mulai dari pemesanan tiket, *seat-locking* real-time, manajemen armada, hingga sistem pelaporan keuangan (*cashflow* & buku besar) otomatis berbasis pemicu (*trigger*).

---

## 📌 Daftar Isi
- [👥 Aktor & Hak Akses (User Roles & ACL)](#-aktor--hak-akses-user-roles--acl)
- [🛠️ Arsitektur & Struktur File](#️-arsitektur--struktur-file)
- [🗄️ Skema Database & Relasi](#️-skema-database--relasi)
- [🔌 Rincian API (Endpoints)](#-rincian-api-endpoints)
- [💻 Tech Stack & Library](#-tech-stack--library)
- [🚀 Panduan Instalasi & Menjalankan Aplikasi](#-panduan-instalasi--menjalankan-aplikasi)

---

## 👥 Aktor & Hak Akses (User Roles & ACL)

Aplikasi ini mengadopsi kontrol akses berbasis peran (RBAC) yang ketat untuk mengamankan data dan membedakan alur kerja:

* **Customer**: Mendaftar dan login mandiri. Dapat mencari jadwal perjalanan aktif, memesan kursi travel (dengan sistem kunci kursi 10 menit), mengajukan sewa charter pariwisata, melakukan pengiriman paket, mengunggah bukti pembayaran, serta memantau riwayat transaksi personal.
* **Driver (Supir)**: Login menggunakan akun khusus yang didaftarkan oleh Super Admin. Driver berhak memantau tugas perjalanan yang diberikan, melihat manifest penumpang per keberangkatan, memperbarui status perjalanan secara real-time, mencatat log perawatan armada (servis rutin/masuk bengkel), dan mengajukan biaya operasional perjalanan (tol, bensin, parkir).
* **Super Admin**: Pengendali penuh sistem. Mengelola seluruh master data, memvalidasi dan memverifikasi bukti transaksi, memverifikasi log perawatan dan klaim biaya operasional driver, serta memantau dashboard analitik keuangan (*ledger cashflow*, *Gross*, dan *Net Profit*).

---

## 🛠️ Arsitektur & Struktur File

Backend ini mengimplementasikan arsitektur **Modular Component-based** untuk memisahkan tanggung jawab (Separation of Concerns):

```text
backend-kerjapraktik/
├── src/
│   ├── config/         # Konfigurasi database Knex, integrasi mailer, & setup Swagger JSDoc
│   ├── controllers/    # Handler HTTP request & response (Logika Kontroler)
│   ├── db/             # Skema migrasi tabel & data dummy (Knex Migrations & Seeds)
│   ├── jobs/           # Pekerjaan latar belakang (Cron Jobs: Auto-cancel Seat Lock)
│   ├── middlewares/    # Middleware autentikasi JWT, otorisasi role, validasi Zod, & pengunggahan file (Multer)
│   ├── models/         # Interaksi query database relasional menggunakan Knex Builder
│   ├── routes/         # Definisi router API Express
│   └── app.js          # Inisialisasi Express app & middleware global
├── public/
│   └── uploads/        # Penyimpanan lokal file statis yang diunggah (bukti transfer, kuitansi)
├── package.json        # Dependensi & script aplikasi
└── README.md
```

### 🏷️ Konvensi Penamaan File (Dot Case Notation)
Pemberian nama file pada seluruh modul menggunakan standar `nama-modul.tipe.js` (contoh: `auth.routes.js`, `travel.controller.js`, `driver.model.js`). Konvensi ini menjamin kelancaran *deployment* lintas sistem operasi (khususnya ke server Linux yang bersifat *case-sensitive*) serta memudahkan pencarian dan pemetaan file dalam editor.

---

## 🗄️ Skema Database & Relasi

Aplikasi menggunakan database **PostgreSQL** relasional dengan tabel-tabel utama sebagai berikut:

```mermaid
erDiagram
    USERS ||--o{ TRAVEL_BOOKINGS : "memesan"
    USERS ||--o{ CHARTER_REQUESTS : "menyewa"
    USERS ||--o{ OPERATIONAL_EXPENSES : "mengajukan (Supir)"
    FLEETS ||--o{ SCHEDULES : "ditugaskan ke"
    FLEETS ||--o{ MAINTENANCE_LOGS : "menjalani"
    ROUTES ||--o{ SCHEDULES : "memiliki"
    SCHEDULES ||--o{ TRAVEL_BOOKINGS : "berisi"
    SCHEDULES ||--o{ OPERATIONAL_EXPENSES : "memiliki biaya"
    TRAVEL_BOOKINGS ||--|| PAYMENTS : "memiliki"
    CHARTER_REQUESTS ||--|| PAYMENTS : "memiliki"
    MAINTENANCE_LOGS ||--|| CASHFLOWS : "memotong saldo (jika disetujui)"
    PAYMENTS ||--|| CASHFLOWS : "menambah saldo (jika disetujui)"
    OPERATIONAL_EXPENSES ||--|| CASHFLOWS : "memotong saldo (jika disetujui)"
```

> [!NOTE]
> Sistem kas masuk (*income*) dan kas keluar (*expense*) dicatat secara otomatis ke dalam tabel `cashflows` melalui database trigger atau integrasi model ketika transaksi/biaya operasional disetujui oleh Super Admin.

---

## 🔌 Rincian API (Endpoints)

Backend ini menyediakan **91 RESTful API** yang terdokumentasi secara interaktif via Swagger. Berikut rangkuman endpoint yang tersedia:

### 1. Autentikasi (`/api/auth`)
| Method | Endpoint | Hak Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Publik | Registrasi customer baru |
| `POST` | `/api/auth/login` | Publik | Login pengguna & mendapatkan JWT token |
| `POST` | `/api/auth/forgot-password` | Publik | Meminta token pemulihan password via email |
| `POST` | `/api/auth/reset-password` | Publik | Mengubah password menggunakan token reset |

### 2. Publik Konten & Informasi Layanan (`/api/content`)
| Method | Endpoint | Hak Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/content/banners` | Publik | Mengambil banner promosi yang sedang aktif |
| `GET` | `/api/content/destinations` | Publik | Mengambil rekomendasi destinasi pariwisata |
| `GET` | `/api/content/promotions` | Publik | Mengambil daftar diskon promo aktif (dapat difilter) |

### 3. Layanan Travel Reguler (`/api/travel`)
| Method | Endpoint | Hak Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/travel/schedules` | Publik | Cari jadwal perjalanan & sisa kursi tersedia |
| `POST` | `/api/travel/bookings` | Customer | Booking kursi travel (mengunci kursi 10 menit) |
| `POST` | `/api/travel/bookings/:id/payment-proof` | Customer | Upload bukti transfer (`multipart/form-data`) |
| `GET` | `/api/travel/history` | Customer | Melihat riwayat pemesanan tiket pelanggan |
| `GET` | `/api/travel/manifest/:schedule_id` | Supir, Admin | Melihat daftar penumpang & nomor kursi |

### 4. Layanan Charter Pariwisata (`/api/charter`)
| Method | Endpoint | Hak Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/charter/request` | Customer | Mengajukan sewa pariwisata |
| `POST` | `/api/charter/request/:id/payment-proof` | Customer | Upload bukti pembayaran sewa pariwisata |
| `GET` | `/api/charter/history` | Customer, Admin | Melihat riwayat charter pribadi/seluruh pengguna |
| `PUT` | `/api/charter/:id/verify` | Admin | Memverifikasi pembayaran sewa charter |

### 5. Layanan Ekspedisi & Paket (`/api/packages`)
| Method | Endpoint | Hak Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/packages/shipments` | Publik/Cust | Mengirim barang (otomatis generate resi) |
| `GET` | `/api/packages/track/:waybill_number` | Publik | Melacak status perjalanan paket dengan nomor resi |
| `GET` | `/api/packages/history` | Customer | Melihat riwayat pengiriman paket |
| `PUT` | `/api/packages/shipments/:id/status` | Supir, Admin | Update status & upload bukti penyerahan (`multipart/form-data`) |

### 6. Driver Area (`/api/driver`)
| Method | Endpoint | Hak Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/driver/schedules` | Supir | Melihat tugas perjalanan yang diberikan |
| `PUT` | `/api/driver/schedules/:id/status` | Supir | Update status perjalanan (board, driving, dll.) |
| `GET` | `/api/driver/expenses` | Supir | Melihat riwayat pengajuan biaya operasional supir |
| `POST` | `/api/driver/expenses` | Supir | Mengajukan biaya operasional (`multipart/form-data`) |
| `GET` | `/api/driver/fleets` | Supir, Admin | Melihat status seluruh armada kendaraan |
| `PUT` | `/api/driver/fleets/:id/status` | Supir, Admin | Mengubah status armada (active / maintenance) |
| `GET` | `/api/driver/maintenance-logs` | Supir, Admin | Melihat histori perbaikan kendaraan |
| `POST` | `/api/driver/maintenance-logs` | Supir, Admin | Melaporkan perbaikan baru + nota (`multipart/form-data`) |
| `PUT` | `/api/driver/maintenance-logs/:id/verify` | Admin | Menolak / menyetujui log perbaikan supir |

### 7. Panel Kelola CMS (`/api/admin/cms`)
Semua rute di bawah `/api/admin/cms` membutuhkan token autentikasi **Super Admin**:
- `/promotions` (GET, POST, PUT, DELETE) - Kelola konten promosi di aplikasi frontend.
- `/fleets` (GET, POST, PUT, DELETE) - Kelola data kendaraan operasional.
- `/banners` (GET, POST, PUT, DELETE) - Kelola spanduk visual halaman depan.
- `/destinations` (GET, POST, PUT, DELETE) - Kelola rekomendasi tujuan liburan populer.

### 8. Panel Master Data & Operasional (`/api/admin/master`)
Semua rute di bawah `/api/admin/master` membutuhkan token autentikasi **Super Admin**:
- `/fleets`, `/routes`, `/schedules`, `/users`, `/banners`, `/destinations`, `/promotions`, `/package-shipments`, `/institutional-expenses` (Seluruhnya mendukung GET, POST, PUT, DELETE secara penuh).
- `PUT` `/schedules/:id/assign` - Menugaskan supir dan unit kendaraan ke jadwal perjalanan reguler.
- `GET` `/travel-bookings` - Memantau antrean pembayaran tiket pelanggan.
- `PUT` `/travel-bookings/:id/verify` - Verifikasi manual lunas tiket regular travel.
- `PUT` `/travel-bookings/:id/status` - Persetujuan, pembatalan, dan modifikasi pesanan tiket travel.

### 9. Rangkuman Dashboard & Cashflow Keuangan (`/api/admin/cashflow` & `/api/admin/dashboard`)
| Method | Endpoint | Hak Akses | Deskripsi |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/dashboard/metrics` | Admin | Memantau omzet harian, jumlah transaksi, kontribusi armada |
| `GET` | `/api/admin/cashflow/summary` | Admin | Rangkuman laba-rugi bersih (*Net Profit*) harian s/d tahunan |
| `GET` | `/api/admin/cashflow/transactions` | Admin | Buku besar mutasi kas masuk/keluar terpaginasi |
| `POST` | `/api/admin/cashflow/expense` | Admin | Mencatat biaya operasional instansi secara manual |
| `GET` | `/api/admin/cashflow/expenses` | Admin | Melihat daftar pengajuan biaya operasional dari supir |
| `PUT` | `/api/admin/cashflow/expenses/:id/approve` | Admin | Memberi persetujuan / penolakan klaim supir |

---

## 💻 Tech Stack & Library

* **Web Server Framework**: Express.js (v5.x)
* **SQL Query Builder**: Knex.js (v3.x)
* **Database Engine**: PostgreSQL (v14+)
* **Engine Runtime**: Node.js (v18+)

### Dependensi Pendukung Utama:
* **Validation**: `zod` - Skema validasi request body yang kuat.
* **Security**: `bcryptjs` (Hashing sandi), `jsonwebtoken` (Otentikasi token JWT stateless), `helmet` (Header security), `cors` (Pembatasan origin aplikasi).
* **Media Handler**: `multer` - Manajemen pengunggahan file fisik (gambar kuitansi & bukti transfer).
* **Background Worker**: `node-cron` - Eksekusi tugas berkala (penghapusan otomatis kunci kursi travel).
* **Documentation**: `swagger-jsdoc` & `swagger-ui-express` - Dokumentasi API dinamis berbasis JSDoc.

---

## 🚀 Panduan Instalasi & Menjalankan Aplikasi

Ikuti petunjuk di bawah ini untuk menyiapkan backend di lingkungan lokal Anda:

### 1. Prasyarat Sistem
* **Node.js** (Versi LTS terbaru direkomendasikan)
* **PostgreSQL Database** lokal/cloud (Supabase / Neon DB / PostgreSQL Desktop)

### 2. Instalasi Dependensi
Kloning repositori dan pasang seluruh paket dependensi:
```bash
git clone https://github.com/RafaelPransa/backend-travel.git
cd backend-travel
npm install
```

### 3. Konfigurasi Variabel Lingkungan (`.env`)
Salin berkas template lingkungan yang disediakan:
```bash
cp .env.example .env
```
Sesuaikan konfigurasi kredensial PostgreSQL dan SMTP Mailer Anda di dalam berkas `.env` yang baru dibuat:
```env
PORT=5000
DB_CLIENT=pg
JWT_SECRET=rahasia_kunci_jwt_anda_disini
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# === KONFIGURASI DATABASE ===
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=password_postgres_anda
DB_NAME=rini_trans_db

# === KONFIGURASI SMTP EMAIL MAILER ===
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=username_mailtrap_anda
SMTP_PASS=password_mailtrap_anda
SMTP_FROM="PT. Rini Trans Putri <noreply@rinitransputri.com>"
FRONTEND_URL=http://localhost:5173
```

### 4. Migrasi & Pengisian Data Awal (Seeds)
Buat kerangka tabel dan masukkan data dummy awal (seperti akun administrator default, armada awal, dan rute) menggunakan Knex CLI:
```bash
# Menjalankan migrasi database
npx knex migrate:latest

# Memasukkan data seeder awal
npx knex seed:run
```

### 5. Jalankan Aplikasi
Jalankan server Express menggunakan nodemon untuk mode pengembangan (*development*):
```bash
npm run dev
```
Server akan berjalan secara lokal di: `http://localhost:5000`

### 6. Tes API secara Interaktif (Swagger UI)
Akses endpoint berikut pada browser Anda untuk menjelajahi dokumentasi API yang lengkap dan mengujinya secara langsung:
👉 **[http://localhost:5000/api-docs](http://localhost:5000/api-docs)**

> [!IMPORTANT]
> Untuk menguji rute yang terproteksi (Admin/Driver/Customer), gunakan endpoint `/api/auth/login` untuk mendapatkan JWT token. Klik tombol **Authorize** di pojok kanan atas Swagger UI, kemudian masukkan token dengan format: `Bearer <token_jwt_anda>`.
