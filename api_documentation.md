# Panduan Dokumentasi API - PT. Rini Trans Putri (Postman)

Berikut adalah daftar lengkap dokumentasi endpoint API Backend yang telah dibangun. Anda dapat langsung menyalin (copy-paste) format ini ke dalam koleksi Postman Anda.

---

## 📂 1. Auth Service

### 1.1 Register Customer
Mendaftarkan pelanggan baru. Secara default role yang diberikan adalah `customer`.
* **Method:** `POST`
* **URL:** `http://localhost:5000/api/auth/register`
* **Access:** Public
* **Request Body (JSON):**
  ```json
  {
    "name": "Budi Santoso",
    "email": "budi@example.com",
    "password": "secretpassword",
    "phone_number": "081234567890"
  }
  ```
* **Success Response (201 Created):**
  ```json
  {
    "status": "success",
    "message": "Registrasi berhasil",
    "data": { ... }
  }
  ```

### 1.2 Login
Autentikasi pengguna untuk mendapatkan Bearer Token JWT.
* **Method:** `POST`
* **URL:** `http://localhost:5000/api/auth/login`
* **Access:** Public
* **Request Body (JSON):**
  ```json
  {
    "email": "budi@example.com",
    "password": "secretpassword"
  }
  ```
* **Success Response (200 OK):**
  ```json
  {
    "status": "success",
    "message": "Login berhasil",
    "data": {
      "token": "eyJhbGciOiJIUzI1NiIsIn...",
      "user": {
        "id": "uuid",
        "name": "Budi Santoso",
        "role": "customer"
      }
    }
  }
  ```

---

## 📂 2. Travel Regular Service

### 2.1 Get Schedules
Menampilkan jadwal travel reguler beserta ketersediaan sisa kursi (*available seats*).
* **Method:** `GET`
* **URL:** `http://localhost:5000/api/travel/schedules`
* **Query Params (Optional):** `?date=YYYY-MM-DD&origin=Ciamis&destination=Jakarta`
* **Access:** Public
* **Success Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": "schedule-uuid",
        "origin": "Ciamis",
        "destination": "Jakarta",
        "base_price": "250000.00",
        "departure_time": "2026-06-10T08:00:00.000Z",
        "available_seats": 5
      }
    ]
  }
  ```

### 2.2 Create Booking
Melakukan pemesanan tiket dengan penguncian kursi (*seat-locking*) selama 10 menit.
* **Method:** `POST`
* **URL:** `http://localhost:5000/api/travel/bookings`
* **Access:** Requires JWT Token (Role: `customer`)
* **Request Body (JSON):**
  ```json
  {
    "schedule_id": "masukkan-uuid-jadwal-disini",
    "seat_number": 3
  }
  ```
* **Success Response (201 Created):**
  ```json
  {
    "status": "success",
    "message": "Booking berhasil dibuat. Kursi dikunci selama 10 menit, segera lakukan pembayaran."
  }
  ```

### 2.3 Get Driver Manifest
Melihat daftar manifest penumpang (hanya yang sudah berstatus `paid` atau `prepaid`).
* **Method:** `GET`
* **URL:** `http://localhost:5000/api/travel/manifest/:schedule_id`
* **Access:** Requires JWT Token (Role: `driver`, `super_admin`)
* **Success Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": [
      {
        "seat_number": 3,
        "name": "Budi Santoso",
        "phone_number": "081234567890",
        "booking_status": "paid"
      }
    ]
  }
  ```

---

## 📂 3. Charter (Pariwisata) Service

### 3.1 Request Charter
Mengajukan penyewaan mobil beserta perhitungan tarif otomatis (*Automated Price Calculation*).
* **Method:** `POST`
* **URL:** `http://localhost:5000/api/charter/request`
* **Access:** Requires JWT Token (Role: `customer`)
* **Request Body (JSON):**
  ```json
  {
    "car_type": "Luxio",
    "destination": "Pangandaran",
    "departure_date": "2026-07-01",
    "return_date": "2026-07-02",
    "notes": "Tolong supir yang ramah"
  }
  ```
* **Success Response (201 Created):**
  ```json
  {
    "status": "success",
    "data": {
      "offered_price": 2400000,
      "total_days": 2,
      "status": "pending"
    }
  }
  ```

### 3.2 Get Charter History
Melihat histori penyewaan pariwisata.
* **Method:** `GET`
* **URL:** `http://localhost:5000/api/charter/history`
* **Access:** Requires JWT Token (Role: `customer`, `super_admin`)
  *(Catatan: Customer hanya melihat data pribadinya, Super Admin melihat semua)*
* **Success Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": [ ... ]
  }
  ```

### 3.3 Verify Charter Payment
Memverifikasi pembayaran pelanggan dan mengubah status transaksi menjadi `paid`.
* **Method:** `PUT`
* **URL:** `http://localhost:5000/api/charter/:id/verify`
* **Access:** Requires JWT Token (Role: `super_admin`)
* **Success Response (200 OK):**
  ```json
  {
    "status": "success",
    "message": "Pembayaran charter berhasil diverifikasi"
  }
  ```

---

## 📂 4. Package Shipment (Courier)

### 4.1 Create Shipment (Generate Waybill)
Membuat pengiriman paket baru. Sistem akan secara otomatis men-*generate* nomor resi.
* **Method:** `POST`
* **URL:** `http://localhost:5000/api/packages/shipments`
* **Access:** Public (Token opsional)
* **Request Body (JSON):**
  ```json
  {
    "sender_name": "Agus",
    "sender_phone": "089876543210",
    "receiver_name": "Siti",
    "receiver_phone": "081231231234",
    "receiver_address": "Jl. Merdeka No.1, Jakarta",
    "package_description": "Dokumen penting"
  }
  ```
* **Success Response (201 Created):**
  ```json
  {
    "status": "success",
    "message": "Pengiriman paket berhasil dibuat",
    "data": {
      "waybill_number": "RTP-A1B2C3D4E5",
      "status": "received"
    }
  }
  ```

### 4.2 Track Package
Melacak status resi pengiriman paket.
* **Method:** `GET`
* **URL:** `http://localhost:5000/api/packages/track/:waybill_number`
* **Access:** Public
* **Success Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "waybill_number": "RTP-A1B2C3D4E5",
      "status": "on_transit"
    }
  }
  ```

### 4.3 Update Package Status
Mengubah posisi resi secara berkala (`received`, `sorting`, `on_transit`, `delivered`).
* **Method:** `PUT`
* **URL:** `http://localhost:5000/api/packages/shipments/:id/status`
* **Access:** Requires JWT Token (Role: `driver`, `super_admin`)
* **Request Body (JSON):**
  ```json
  {
    "status": "on_transit"
  }
  ```

---

## 📂 5. Financial Dashboard

### 5.1 Get Cashflow Summary
Melihat total pendapatan, pengeluaran, dan kalkulasi profit bersih PT. Rini Trans Putri.
* **Method:** `GET`
* **URL:** `http://localhost:5000/api/admin/cashflow/summary`
* **Access:** Requires JWT Token (Role: `super_admin`)
* **Success Response (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "total_income": 10500000,
      "total_expense": 2000000,
      "net_profit": 8500000
    }
  }
  ```
