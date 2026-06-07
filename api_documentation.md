# Panduan Dokumentasi API PT. Rini Trans Putri (Postman & Frontend Integration)

Dokumentasi ini dirancang agar tim Frontend dapat dengan mudah mengintegrasikan aplikasi dengan Backend. Setiap endpoint telah disesuaikan dengan skema validasi Zod, otentikasi JWT, batasan ukuran file, middleware keamanan, dan relasi basis data yang aktif.

---

## 🔒 1. Konfigurasi Global & Keamanan

### 1.1 Host & Base URL
* **Local Development:** `http://localhost:3000` (atau port lain sesuai variabel lingkungan `PORT` di `.env`).
* **Header Default:** `Content-Type: application/json` (Kecuali untuk endpoint upload file).

### 1.2 Otentikasi (JWT Bearer Token)
Endpoint yang membutuhkan otentikasi mengharuskan pengiriman header berikut:
```http
Authorization: Bearer <your_jwt_token>
```
*Token didapatkan dari response sukses endpoint Login.*

### 1.3 CORS Policy (Cross-Origin Resource Sharing)
* **Allowed Origins:** Diatur melalui variabel lingkungan `ALLOWED_ORIGINS` (berupa string terpisah koma).
* **Default Origins:** `http://localhost:3000`, `http://localhost:5173`.
* **Catatan:** Request tanpa origin (seperti dari Postman, curl, atau aplikasi mobile asli) diperbolehkan secara otomatis.

### 1.4 Rate Limiting (Pencegahan Bruteforce & DoS)
* **Auth Rate Limiter:** Maksimal **10 request per 15 menit** per IP Address khusus untuk route di bawah `/api/auth/*`.
* **Global Rate Limiter:** Maksimal **100 request per 15 menit** per IP Address untuk seluruh route lain di bawah `/api/*`.
* **Response jika terlimit (HTTP 429 Too Many Requests):**
  ```json
  {
    "status": "error",
    "message": "Terlalu banyak permintaan dari IP ini. Silakan coba lagi setelah 15 menit."
  }
  ```

### 1.5 Pembatasan Payload (Request Body Size)
* Maksimal ukuran JSON payload dan urlencoded body adalah **1MB**. Jika melebihi batas, server akan menolak request.

### 1.6 Upload File Bukti Pembayaran (Multer)
* **Field Name:** `payment_proof`
* **Format yang Didukung:** `.jpg`, `.jpeg`, `.png`
* **Maksimal Ukuran File:** **5MB**
* **Target Direktori Publik:** `/uploads/payments/` (Dapat diakses di browser melalui `http://<host>/uploads/payments/<filename>`).

---

## 📂 2. Auth Service

### 2.1 Register Customer
* **Method & URL Route:** `POST /api/auth/register`
* **Akses:** Public (Tidak butuh token)
* **Validasi Request Body (JSON):**
  | Field | Tipe | Wajib | Keterangan |
  | :--- | :--- | :--- | :--- |
  | `name` | String | Ya | Minimal 3 karakter, maksimal 100 karakter. |
  | `email` | String | Ya | Harus format email valid, maksimal 100 karakter. |
  | `password` | String | Ya | Minimal 6 karakter. |
  | `phone_number` | String | Ya | Minimal 10 karakter, maksimal 15 karakter. |

* **Contoh Request Body:**
  ```json
  {
    "name": "Rafael Pransa",
    "email": "rafael@example.com",
    "password": "rahasia_aman",
    "phone_number": "081234567890"
  }
  ```
* **Contoh Response Success (201 Created):**
  ```json
  {
    "status": "success",
    "message": "User berhasil diregistrasi",
    "data": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "name": "Rafael Pransa",
      "email": "rafael@example.com",
      "role": "customer",
      "phone_number": "081234567890",
      "created_at": "2026-06-07T16:54:13.000Z"
    }
  }
  ```

### 2.2 Login
* **Method & URL Route:** `POST /api/auth/login`
* **Akses:** Public
* **Validasi Request Body (JSON):**
  | Field | Tipe | Wajib | Keterangan |
  | :--- | :--- | :--- | :--- |
  | `email` | String | Ya | Harus format email valid. |
  | `password` | String | Ya | Wajib diisi. |

* **Contoh Request Body:**
  ```json
  {
    "email": "rafael@example.com",
    "password": "rahasia_aman"
  }
  ```
* **Contoh Response Success (200 OK):**
  ```json
  {
    "status": "success",
    "message": "Login berhasil",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEyM2U0NTY3LWU4OWItMTJkMy1hNDU2LTQyNjYxNDE3NDAwMCIsInJvbGUiOiJjdXN0b21lciJ9...",
      "user": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Rafael Pransa",
        "email": "rafael@example.com",
        "role": "customer",
        "phone_number": "081234567890"
      }
    }
  }
  ```

---

## 📂 3. Travel Regular Service (Shuttle)

### 3.1 Get Schedules (Mencari Jadwal)
Melihat jadwal aktif yang memiliki status `scheduled`. Endpoint ini akan menghitung ketersediaan kursi (`available_seats`) secara real-time dengan mengurangi kapasitas mobil dengan pesanan berstatus `paid`, `prepaid`, atau pesanan berstatus `pending` yang durasi kunci kursinya belum habis (kurang dari 10 menit).
* **Method & URL Route:** `GET /api/travel/schedules`
* **Akses:** Public
* **Query Parameters (Opsional untuk filter):**
  | Parameter | Tipe | Contoh | Keterangan |
  | :--- | :--- | :--- | :--- |
  | `date` | String | `2026-06-15` | Format tanggal harus YYYY-MM-DD. |
  | `origin` | String | `Ciamis` | Kota asal perjalanan. |
  | `destination` | String | `Jakarta` | Kota tujuan perjalanan. |

* **Contoh Response Success (200 OK):**
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": "sch-uuid-1",
        "origin": "Ciamis",
        "destination": "Jakarta",
        "base_price": 250000,
        "departure_time": "2026-06-15T08:00:00.000Z",
        "status": "scheduled",
        "plate_number": "Z 1234 TA",
        "car_type": "Luxio",
        "seat_capacity": 6,
        "available_seats": 5
      }
    ]
  }
  ```

### 3.2 Create Booking (Pemesanan Kursi)
Pemesanan awal untuk mengunci kursi yang dipilih. Kursi akan dikunci secara otomatis selama **10 menit** (`locked_until`). Jika dalam 10 menit bukti pembayaran belum diunggah, kursi tersebut otomatis dapat dipesan oleh pengguna lain dan status pesanan dibatalkan melalui cron job otomatis backend.
* **Method & URL Route:** `POST /api/travel/bookings`
* **Akses:** Bearer Token JWT (Role: `customer`)
* **Validasi Request Body (JSON):**
  | Field | Tipe | Wajib | Keterangan |
  | :--- | :--- | :--- | :--- |
  | `schedule_id` | String (UUID) | Ya | ID jadwal travel yang valid. |
  | `seat_number` | Integer | Ya | Angka bulat positif. |

* **Contoh Request Body:**
  ```json
  {
    "schedule_id": "8c0a25df-32ef-4b47-b50a-3a1b80c55fde",
    "seat_number": 3
  }
  ```
* **Contoh Response Success (201 Created):**
  ```json
  {
    "status": "success",
    "message": "Booking berhasil dibuat. Kursi dikunci selama 10 menit, segera lakukan pembayaran.",
    "data": {
      "id": "bfa89a31-7e82-4ad6-ac83-d922f30ea1d8",
      "user_id": "123e4567-e89b-12d3-a456-426614174000",
      "schedule_id": "8c0a25df-32ef-4b47-b50a-3a1b80c55fde",
      "seat_number": 3,
      "booking_status": "pending",
      "locked_until": "2026-06-07T17:04:13.000Z",
      "payment_proof_url": null,
      "created_at": "2026-06-07T16:54:13.000Z"
    }
  }
  ```
* **Contoh Response Failure - Kursi Sudah Dipesan (400 Bad Request):**
  ```json
  {
    "status": "error",
    "message": "Kursi sudah dipesan atau sedang dikunci (menunggu pembayaran) oleh pengguna lain"
  }
  ```

### 3.3 Upload Bukti Pembayaran Travel
Mengunggah file gambar sebagai bukti transfer. Mengubah status pemesanan dari `pending` menjadi `locked` sehingga aman dari pembatalan otomatis cron job dan masuk ke antrean verifikasi Admin.
* **Method & URL Route:** `POST /api/travel/bookings/:id/payment-proof`
* **Akses:** Bearer Token JWT (Role: `customer`)
* **URL Params:** `:id` adalah booking ID (UUID).
* **Headers:** `Content-Type: multipart/form-data`
* **Request Body (form-data):**
  | Key | Tipe | Wajib | Keterangan |
  | :--- | :--- | :--- | :--- |
  | `payment_proof` | File | Ya | File gambar (.jpg, .jpeg, .png) maks. 5MB. |

* **Contoh Response Success (200 OK):**
  ```json
  {
    "status": "success",
    "message": "Bukti pembayaran berhasil diunggah. Menunggu verifikasi dari Super Admin.",
    "data": {
      "id": "bfa89a31-7e82-4ad6-ac83-d922f30ea1d8",
      "user_id": "123e4567-e89b-12d3-a456-426614174000",
      "schedule_id": "8c0a25df-32ef-4b47-b50a-3a1b80c55fde",
      "seat_number": 3,
      "booking_status": "locked",
      "locked_until": "2026-06-07T17:04:13.000Z",
      "payment_proof_url": "http://localhost:3000/uploads/payments/payment-1686123456789.png",
      "created_at": "2026-06-07T16:54:13.000Z"
    }
  }
  ```

### 3.4 Get Travel History
Mendapatkan semua riwayat pemesanan travel yang dilakukan oleh customer yang sedang login.
* **Method & URL Route:** `GET /api/travel/history`
* **Akses:** Bearer Token JWT (Role: `customer`)
* **Contoh Response Success (200 OK):**
  ```json
  {
    "status": "success",
    "message": "Berhasil mengambil riwayat pemesanan travel",
    "data": [
      {
        "booking_id": "bfa89a31-7e82-4ad6-ac83-d922f30ea1d8",
        "seat_number": 3,
        "booking_status": "locked",
        "created_at": "2026-06-07T16:54:13.000Z",
        "origin": "Ciamis",
        "destination": "Jakarta",
        "departure_time": "2026-06-15T08:00:00.000Z",
        "schedule_status": "scheduled"
      }
    ]
  }
  ```

### 3.5 Get Driver Manifest
Melihat daftar nama penumpang dan kursi yang sudah terbayar (`paid` atau `prepaid`) untuk jadwal tertentu.
* **Method & URL Route:** `GET /api/travel/manifest/:schedule_id`
* **Akses:** Bearer Token JWT (Role: `driver`, `super_admin`)
* **URL Params:** `:schedule_id` (UUID).
* **Contoh Response Success (200 OK):**
  ```json
  {
    "status": "success",
    "data": [
      {
        "seat_number": 3,
        "name": "Rafael Pransa",
        "phone_number": "081234567890",
        "booking_status": "paid"
      }
    ]
  }
  ```

---

## 📂 4. Charter (Pariwisata) Service

### 4.1 Request Charter (Pengajuan Sewa)
Mengajukan sewa pariwisata. Sistem akan menghitung jumlah hari sewa secara **inklusif** (misal: tanggal 1 s/d 3 Juli dihitung 3 hari) dan melakukan perhitungan total harga (`offered_price`) otomatis berdasarkan tipe armada:
- **Luxio:** Rp1.200.000 per hari
- **Elf:** Rp1.500.000 per hari
* **Method & URL Route:** `POST /api/charter/request`
* **Akses:** Bearer Token JWT (Role: `customer`)
* **Validasi Request Body (JSON):**
  | Field | Tipe | Wajib | Keterangan |
  | :--- | :--- | :--- | :--- |
  | `car_type` | String | Ya | Hanya bernilai `"Luxio"` atau `"Elf"`. |
  | `destination` | String | Ya | Nama destinasi sewa, minimal 3 karakter. |
  | `departure_date`| String | Ya | Tanggal keberangkatan format YYYY-MM-DD. |
  | `return_date` | String | Ya | Tanggal kepulangan format YYYY-MM-DD (tidak boleh mendahului departure_date). |
  | `notes` | String | Tidak | Catatan tambahan (misal: "minta unit warna silver"). |

* **Contoh Request Body:**
  ```json
  {
    "car_type": "Luxio",
    "destination": "Pangandaran",
    "departure_date": "2026-07-01",
    "return_date": "2026-07-03",
    "notes": "Minta sopir yang ramah"
  }
  ```
* **Contoh Response Success (201 Created):**
  ```json
  {
    "status": "success",
    "message": "Pengajuan charter berhasil dibuat. Silakan lakukan pembayaran.",
    "data": {
      "id": "char-uuid-9999",
      "user_id": "123e4567-e89b-12d3-a456-426614174000",
      "car_type": "Luxio",
      "destination": "Pangandaran",
      "departure_date": "2026-07-01",
      "return_date": "2026-07-03",
      "notes": "Minta sopir yang ramah",
      "offered_price": 3600000,
      "status": "pending",
      "payment_proof_url": null,
      "created_at": "2026-06-07T16:54:13.000Z",
      "total_days": 3
    }
  }
  ```

### 4.2 Upload Bukti Pembayaran Charter
* **Method & URL Route:** `POST /api/charter/request/:id/payment-proof`
* **Akses:** Bearer Token JWT (Role: `customer`)
* **URL Params:** `:id` adalah charter ID (UUID).
* **Headers:** `Content-Type: multipart/form-data`
* **Request Body (form-data):**
  | Key | Tipe | Wajib | Keterangan |
  | :--- | :--- | :--- | :--- |
  | `payment_proof` | File | Ya | File gambar (.jpg, .jpeg, .png) maks. 5MB. |

* **Contoh Response Success (200 OK):**
  ```json
  {
    "status": "success",
    "message": "Bukti pembayaran charter berhasil diunggah. Menunggu verifikasi dari Super Admin.",
    "data": {
      "id": "char-uuid-9999",
      "user_id": "123e4567-e89b-12d3-a456-426614174000",
      "car_type": "Luxio",
      "destination": "Pangandaran",
      "departure_date": "2026-07-01",
      "return_date": "2026-07-03",
      "offered_price": 3600000,
      "status": "pending",
      "payment_proof_url": "http://localhost:3000/uploads/payments/payment-1686123456789.png",
      "created_at": "2026-06-07T16:54:13.000Z"
    }
  }
  ```

### 4.3 Get Charter History
Mendapatkan riwayat sewa. Bagi `customer`, hanya mengambil riwayat pribadinya. Bagi `super_admin`, mengambil riwayat sewa dari seluruh pelanggan.
* **Method & URL Route:** `GET /api/charter/history`
* **Akses:** Bearer Token JWT (Role: `customer`, `super_admin`)
* **Contoh Response Success (200 OK):**
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": "char-uuid-9999",
        "user_id": "123e4567-e89b-12d3-a456-426614174000",
        "car_type": "Luxio",
        "destination": "Pangandaran",
        "departure_date": "2026-07-01",
        "return_date": "2026-07-03",
        "notes": "Minta sopir yang ramah",
        "offered_price": "3600000.00",
        "status": "pending",
        "payment_proof_url": "http://localhost:3000/uploads/payments/payment-1686123456789.png",
        "created_at": "2026-06-07T16:54:13.000Z",
        "customer_name": "Rafael Pransa",
        "customer_phone": "081234567890"
      }
    ]
  }
  ```

### 4.4 Verify Charter Payment
Menyetujui pembayaran sewa pariwisata. Status pengajuan berubah menjadi `"paid"`.
* **Method & URL Route:** `PUT /api/charter/:id/verify`
* **Akses:** Bearer Token JWT (Role: `super_admin`)
* **URL Params:** `:id` adalah charter ID (UUID).
* **Contoh Response Success (200 OK):**
  ```json
  {
    "status": "success",
    "message": "Pembayaran charter berhasil diverifikasi",
    "data": {
      "id": "char-uuid-9999",
      "status": "paid"
    }
  }
  ```

---

## 📂 5. Package Shipment (Kurir Paket)

### 5.1 Create Shipment (Kirim Paket Baru)
Membuat pengiriman paket baru. Tiket resi otomatis dibuat dengan format `RTP-[HEX-10-Karakter]` (contoh: `RTP-3F7A2C9B1E`). Status awal pengiriman adalah `"received"`.
* **Method & URL Route:** `POST /api/packages/shipments`
* **Akses:** Public (Opsional: Jika menyertakan token JWT Customer, sistem merekam `user_id` agar masuk ke riwayat kiriman mereka).
* **Validasi Request Body (JSON):**
  | Field | Tipe | Wajib | Keterangan |
  | :--- | :--- | :--- | :--- |
  | `sender_name` | String | Ya | Minimal 3 karakter. |
  | `sender_phone` | String | Ya | Minimal 10 karakter, maksimal 15 karakter. |
  | `receiver_name` | String | Ya | Minimal 3 karakter. |
  | `receiver_phone` | String | Ya | Minimal 10 karakter, maksimal 15 karakter. |
  | `receiver_address`| String | Ya | Minimal 10 karakter, alamat lengkap penerima. |
  | `package_description`| String| Ya | Deskripsi isi paket, minimal 3 karakter. |

* **Contoh Request Body:**
  ```json
  {
    "sender_name": "Agus",
    "sender_phone": "089876543210",
    "receiver_name": "Siti",
    "receiver_phone": "081231231234",
    "receiver_address": "Jl. Merdeka No.1, Jakarta Pusat",
    "package_description": "Dokumen Penting"
  }
  ```
* **Contoh Response Success (201 Created):**
  ```json
  {
    "status": "success",
    "message": "Pengiriman paket berhasil dibuat",
    "data": {
      "id": "pkg-uuid-8888",
      "user_id": null,
      "waybill_number": "RTP-D3F2E1A4C5",
      "sender_name": "Agus",
      "sender_phone": "089876543210",
      "receiver_name": "Siti",
      "receiver_phone": "081231231234",
      "receiver_address": "Jl. Merdeka No.1, Jakarta Pusat",
      "package_description": "Dokumen Penting",
      "status": "received",
      "created_at": "2026-06-07T16:54:13.000Z"
    }
  }
  ```

### 5.2 Track Package (Lacak Resi)
Melacak status perjalanan paket menggunakan nomor resi.
* **Method & URL Route:** `GET /api/packages/track/:waybill_number`
* **Akses:** Public
* **URL Params:** `:waybill_number` (Contoh: `RTP-D3F2E1A4C5`).
* **Contoh Response Success (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "id": "pkg-uuid-8888",
      "waybill_number": "RTP-D3F2E1A4C5",
      "sender_name": "Agus",
      "receiver_name": "Siti",
      "receiver_address": "Jl. Merdeka No.1, Jakarta Pusat",
      "package_description": "Dokumen Penting",
      "status": "on_transit",
      "created_at": "2026-06-07T16:54:13.000Z"
    }
  }
  ```
* **Contoh Response Failure - Resi Tidak Ada (404 Not Found):**
  ```json
  {
    "status": "error",
    "message": "Resi tidak ditemukan"
  }
  ```

### 5.3 Update Package Status
Memperbarui status lokasi/posisi paket.
* **Method & URL Route:** `PUT /api/packages/shipments/:id/status`
* **Akses:** Bearer Token JWT (Role: `driver`, `super_admin`)
* **URL Params:** `:id` adalah Package ID (UUID).
* **Validasi Request Body (JSON):**
  | Field | Tipe | Wajib | Keterangan |
  | :--- | :--- | :--- | :--- |
  | `status` | String | Ya | Hanya menerima: `"received"`, `"sorting"`, `"on_transit"`, atau `"delivered"`. |

* **Contoh Request Body:**
  ```json
  {
    "status": "on_transit"
  }
  ```
* **Contoh Response Success (200 OK):**
  ```json
  {
    "status": "success",
    "message": "Status paket berhasil diperbarui",
    "data": {
      "id": "pkg-uuid-8888",
      "status": "on_transit",
      "waybill_number": "RTP-D3F2E1A4C5"
    }
  }
  ```

### 5.4 Get Package History
Melihat semua riwayat pengiriman paket yang dikirim oleh customer yang terhubung (saat membuat paket menyertakan token login).
* **Method & URL Route:** `GET /api/packages/history`
* **Akses:** Bearer Token JWT (Role: `customer`)
* **Contoh Response Success (200 OK):**
  ```json
  {
    "status": "success",
    "message": "Berhasil mengambil riwayat pengiriman paket",
    "data": [
      {
        "id": "pkg-uuid-8888",
        "waybill_number": "RTP-D3F2E1A4C5",
        "sender_name": "Agus",
        "receiver_name": "Siti",
        "package_description": "Dokumen Penting",
        "status": "on_transit",
        "created_at": "2026-06-07T16:54:13.000Z"
      }
    ]
  }
  ```

---

## 📂 6. Driver Area

### 6.1 Get My Schedules & Passenger Manifests
Mendapatkan seluruh daftar jadwal perjalanan yang ditugaskan kepada driver yang sedang login, lengkap dengan daftar manifest penumpangnya (kursi & nama penumpang berstatus `paid`/`prepaid`). Endpoint ini bebas dari kendala query N+1 karena dimuat menggunakan teknik batch-fetch in-memory di sisi backend.
* **Method & URL Route:** `GET /api/driver/schedules`
* **Akses:** Bearer Token JWT (Role: `driver`)
* **Contoh Response Success (200 OK):**
  ```json
  {
    "status": "success",
    "message": "Berhasil mengambil daftar tugas supir",
    "data": [
      {
        "id": "sch-uuid-1234",
        "departure_time": "2026-06-15T08:00:00.000Z",
        "status": "scheduled",
        "origin": "Ciamis",
        "destination": "Jakarta",
        "base_price": 250000,
        "plate_number": "Z 1234 TA",
        "car_type": "Luxio",
        "seat_capacity": 6,
        "passengers": [
          {
            "seat_number": 3,
            "passenger_name": "Rafael Pransa",
            "passenger_phone": "081234567890",
            "booking_status": "paid"
          }
        ]
      }
    ]
  }
  ```

### 6.2 Update Trip Status
Mengubah status keberangkatan operasional armada. Driver hanya dapat mengedit jadwal yang ditugaskan kepada dirinya.
* **Method & URL Route:** `PUT /api/driver/schedules/:id/status`
* **Akses:** Bearer Token JWT (Role: `driver`)
* **URL Params:** `:id` adalah Schedule ID (UUID).
* **Validasi Request Body (JSON):**
  | Field | Tipe | Wajib | Keterangan |
  | :--- | :--- | :--- | :--- |
  | `status` | String | Ya | Hanya menerima: `"scheduled"`, `"board"`, `"driving"`, `"completed"`, atau `"cancelled"`. |

* **Contoh Request Body:**
  ```json
  {
    "status": "driving"
  }
  ```
* **Contoh Response Success (200 OK):**
  ```json
  {
    "status": "success",
    "message": "Status perjalanan berhasil diperbarui menjadi 'driving'",
    "data": {
      "id": "sch-uuid-1234",
      "status": "driving",
      "driver_id": "driver-uuid-5555"
    }
  }
  ```

---

## 📂 7. Super Admin Area - Keuangan & Operasional

### 7.1 Get Cashflow Summary (Laporan Keuangan)
Menampilkan rangkuman data kas masuk (total dari pembayaran tiket regular dan sewa charter) serta kas keluar (operasional). Net profit dihitung otomatis di backend.
* **Method & URL Route:** `GET /api/admin/cashflow/summary`
* **Akses:** Bearer Token JWT (Role: `super_admin`)
* **Contoh Response Success (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "total_income": 15000000,
      "total_expense": 2000000,
      "net_profit": 13000000
    }
  }
  ```

### 7.2 Record Expense (Input Pengeluaran)
Mencatat pengeluaran operasional perusahaan (contoh: bensin, servis mobil, tol).
* **Method & URL Route:** `POST /api/admin/cashflow/expense`
* **Akses:** Bearer Token JWT (Role: `super_admin`)
* **Validasi Request Body (JSON):**
  | Field | Tipe | Wajib | Keterangan |
  | :--- | :--- | :--- | :--- |
  | `amount` | Number | Ya | Angka numerik positif (harga pengeluaran). |
  | `category` | String | Ya | Kategori pengeluaran (min. 1 karakter), misal: `"fuel"`, `"maintenance"`. |
  | `description`| String | Tidak | Rincian detail pengeluaran. |

* **Contoh Request Body:**
  ```json
  {
    "amount": 150000,
    "category": "fuel",
    "description": "Beli Pertalite unit Luxio Ciamis-Jakarta"
  }
  ```
* **Contoh Response Success (201 Created):**
  ```json
  {
    "status": "success",
    "message": "Pengeluaran operasional berhasil dicatat",
    "data": {
      "id": "exp-uuid-1111",
      "amount": 150000,
      "type": "expense",
      "category": "fuel",
      "description": "Beli Pertalite unit Luxio Ciamis-Jakarta",
      "created_at": "2026-06-07T16:54:13.000Z"
    }
  }
  ```

---

## 📂 8. Super Admin Area - Kelola Master Data (CRUD)

Semua rute Master Data di bawah dikelola secara dinamis dan aman dengan whitelist proteksi injeksi SQL. Setiap endpoint POST/PUT di bawah divalidasi ketat menggunakan Zod schema.

### 8.1 Ringkasan Route CRUD Dinamis
Ganti kata kunci `:resource` pada URL `/api/admin/master/:resource` dengan salah satu tabel di bawah:
1. `users` (Manajemen pelanggan, driver, super admin)
2. `fleets` (Manajemen data armada mobil)
3. `routes` (Manajemen rute trayek perjalanan)
4. `schedules` (Manajemen jadwal keberangkatan)
5. `banners` (Manajemen banner promosi)
6. `destinations` (Manajemen destinasi wisata rekomendasi)

#### A. Read All Records
* **Method & URL:** `GET /api/admin/master/:resource`
* **Contoh URL:** `GET /api/admin/master/users`
* **Akses:** Bearer Token JWT (Role: `super_admin`)
* **Contoh Response Success (200 OK):**
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": "user-uuid-1",
        "name": "Driver Budi",
        "email": "budi@driver.com",
        "phone_number": "08122334455",
        "role": "driver",
        "created_at": "2026-06-07T16:54:13.000Z"
      }
    ]
  }
  ```
  *(Catatan keamanan: Kolom sensitif seperti `password` telah disaring secara otomatis dan tidak akan dikirim ke client).*

#### B. Create Record
* **Method & URL:** `POST /api/admin/master/:resource`
* **Contoh URL:** `POST /api/admin/master/fleets`
* **Akses:** Bearer Token JWT (Role: `super_admin`)
* **Validasi Skema (Zod):**
  * **users:**
    - `name` (String, min 1)
    - `email` (String format email)
    - `password` (String, min 6, opsional - akan di-hash otomatis di database jika diisi)
    - `phone_number` (String, min 10)
    - `role` (Enum: `"customer"`, `"driver"`, `"super_admin"`)
  * **fleets:**
    - `plate_number` (String, min 1)
    - `car_type` (String, min 1)
    - `seat_capacity` (Number, int, positif)
    - `status` (Enum opsional: `"active"`, `"maintenance"`)
  * **routes:**
    - `origin` (String, min 1)
    - `destination` (String, min 1)
    - `base_price` (Number positif)
  * **schedules:**
    - `route_id` (String UUID)
    - `departure_time` (String format ISO DateTime, contoh: `"2026-06-15T08:00:00.000Z"`)
    - `status` (Enum opsional: `"scheduled"`, `"board"`, `"driving"`, `"completed"`, `"cancelled"`)
  * **banners:**
    - `title` (String, min 1)
    - `image_url` (String format URL valid)
    - `is_active` (Boolean opsional)
  * **destinations:**
    - `name` (String, min 1)
    - `description` (String, min 1)
    - `image_url` (String format URL valid)

* **Contoh Request Body (POST fleets):**
  ```json
  {
    "plate_number": "Z 9999 XX",
    "car_type": "Elf",
    "seat_capacity": 15
  }
  ```
* **Contoh Response Success (201 Created):**
  ```json
  {
    "status": "success",
    "message": "Data berhasil ditambahkan",
    "data": {
      "id": "new-fleet-uuid",
      "plate_number": "Z 9999 XX",
      "car_type": "Elf",
      "seat_capacity": 15,
      "status": "active",
      "created_at": "2026-06-07T16:54:13.000Z"
    }
  }
  ```

#### C. Update Record
* **Method & URL:** `PUT /api/admin/master/:resource/:id`
* **Contoh URL:** `PUT /api/admin/master/fleets/new-fleet-uuid`
* **Akses:** Bearer Token JWT (Role: `super_admin`)
* **Validasi Skema:** Sama dengan skema Create Record di atas.
* **Contoh Request Body (PUT):**
  ```json
  {
    "plate_number": "Z 9999 XX",
    "car_type": "Elf",
    "seat_capacity": 15,
    "status": "maintenance"
  }
  ```
* **Contoh Response Success (200 OK):**
  ```json
  {
    "status": "success",
    "message": "Data berhasil diubah",
    "data": {
      "id": "new-fleet-uuid",
      "plate_number": "Z 9999 XX",
      "car_type": "Elf",
      "seat_capacity": 15,
      "status": "maintenance"
    }
  }
  ```

#### D. Delete Record
* **Method & URL:** `DELETE /api/admin/master/:resource/:id`
* **Contoh URL:** `DELETE /api/admin/master/fleets/new-fleet-uuid`
* **Akses:** Bearer Token JWT (Role: `super_admin`)
* **Contoh Response Success (200 OK):**
  ```json
  {
    "status": "success",
    "message": "Data berhasil dihapus"
  }
  ```
* **Contoh Response Failure - Terikat Foreign Key (500 Server Error):**
  ```json
  {
    "status": "error",
    "message": "Gagal menghapus data. Kemungkinan data ini sedang terpakai (Constraint Foreign Key)"
  }
  ```

### 8.2 Assign Driver & Fleet to Schedule (Plotting Armada & Sopir)
Menugaskan driver dan unit mobil (fleet) ke jadwal travel tertentu.
* **Method & URL Route:** `PUT /api/admin/master/schedules/:id/assign`
* **Akses:** Bearer Token JWT (Role: `super_admin`)
* **URL Params:** `:id` adalah Schedule ID (UUID).
* **Validasi Request Body (JSON):**
  | Field | Tipe | Wajib | Keterangan |
  | :--- | :--- | :--- | :--- |
  | `fleet_id` | String (UUID) | Ya | ID armada mobil yang aktif. |
  | `driver_id` | String (UUID) | Ya | ID akun user dengan role `"driver"`. |

* **Contoh Request Body:**
  ```json
  {
    "fleet_id": "fleet-uuid-abcde",
    "driver_id": "driver-uuid-12345"
  }
  ```
* **Contoh Response Success (200 OK):**
  ```json
  {
    "status": "success",
    "message": "Berhasil menugaskan armada dan driver",
    "data": {
      "id": "sch-uuid-1234",
      "fleet_id": "fleet-uuid-abcde",
      "driver_id": "driver-uuid-12345",
      "status": "scheduled",
      ...
    }
  }
  ```

### 8.3 Get Travel Bookings (Daftar Antrean Tiket Regular)
Melihat data pesanan travel regular dari seluruh pelanggan lengkap dengan bukti pembayaran untuk keperluan verifikasi.
* **Method & URL Route:** `GET /api/admin/master/travel-bookings`
* **Akses:** Bearer Token JWT (Role: `super_admin`)
* **Contoh Response Success (200 OK):**
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": "bfa89a31-7e82-4ad6-ac83-d922f30ea1d8",
        "seat_number": 3,
        "booking_status": "locked",
        "payment_proof_url": "http://localhost:3000/uploads/payments/payment-1686123456789.png",
        "customer_name": "Rafael Pransa",
        "origin": "Ciamis",
        "destination": "Jakarta",
        "departure_time": "2026-06-15T08:00:00.000Z"
      }
    ]
  }
  ```

### 8.4 Verify Travel Booking (Verifikasi Tiket Regular)
Melakukan verifikasi/persetujuan atas pembayaran tiket regular. Mengubah status pesanan dari `locked` menjadi `paid`. Hanya tiket berstatus `locked` (sudah upload bukti pembayaran) yang dapat diverifikasi.
* **Method & URL Route:** `PUT /api/admin/master/travel-bookings/:id/verify`
* **Akses:** Bearer Token JWT (Role: `super_admin`)
* **URL Params:** `:id` adalah booking ID (UUID).
* **Contoh Response Success (200 OK):**
  ```json
  {
    "status": "success",
    "message": "Pembayaran tiket travel berhasil diverifikasi",
    "data": {
      "id": "bfa89a31-7e82-4ad6-ac83-d922f30ea1d8",
      "booking_status": "paid",
      ...
    }
  }
  ```
* **Contoh Response Failure - Tidak valid (404 Not Found):**
  ```json
  {
    "status": "error",
    "message": "Pesanan tidak ditemukan atau pelanggan belum mengunggah bukti pembayaran"
  }
  ```

---

## 📂 9. Struktur Standard Error Responses

Backend mengembalikan format error standar untuk mempermudah penanganan error (*error handling*) di sisi frontend.

### 9.1 Zod Validation Error (HTTP 400 Bad Request)
Dikembalikan ketika request body tidak lolos validasi skema Zod.
```json
{
  "status": "error",
  "message": "Validasi gagal",
  "errors": [
    "Nomor HP penerima tidak valid",
    "Alamat penerima wajib diisi lengkap"
  ]
}
```

### 9.2 Unauthorized Error (HTTP 401 Unauthorized)
Dikembalikan ketika token tidak ada, salah, atau telah kedaluwarsa.
```json
{
  "status": "error",
  "message": "Token tidak valid atau kedaluwarsa"
}
```

### 9.3 Forbidden Error (HTTP 403 Forbidden)
Dikembalikan ketika user mencoba mengakses endpoint yang bukan merupakan hak akses perannya (role).
```json
{
  "status": "error",
  "message": "Akses ditolak. Role Anda tidak diizinkan."
}
```

### 9.4 File Upload Error (HTTP 400 Bad Request)
Dikembalikan ketika file upload melebihi kapasitas (5MB) otonom atau ekstensi file tidak sesuai (.pdf/.txt dll).
* **Kasus melebihi batas ukuran (5MB):**
  ```json
  {
    "status": "error",
    "message": "Ukuran file terlalu besar. Maksimal 5MB."
  }
  ```
* **Kasus ekstensi tidak didukung:**
  ```json
  {
    "status": "error",
    "message": "Format file tidak didukung. Hanya menerima JPG, JPEG, atau PNG."
  }
  ```

### 9.5 Internal Server Error (HTTP 500 Internal Server Error)
Dikembalikan ketika terjadi kegagalan sistem internal di server. Detail stack trace/pesan error asli disembunyikan untuk aspek keamanan.
```json
{
  "status": "error",
  "message": "Internal Server Error"
}
```
