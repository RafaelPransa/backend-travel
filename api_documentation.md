# Panduan Dokumentasi API PT. Rini Trans Putri (Postman)

Berikut adalah ringkasan dokumentasi API yang *siap disalin* (*copy-paste*) ke dalam Postman Collection Anda. Setiap entri telah dilengkapi dengan tipe *Method*, *Route*, level akses (Token), serta contoh *Request* dan *Response*-nya.

---

## 📂 1. Auth Service

### 1.1 Register Customer
* **Method & URL Route:** `POST /api/auth/register`
* **Kebutuhan Akses Token:** Public (Tidak butuh token)
* **Contoh Request Body (JSON):**
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
      "role": "customer"
    }
  }
  ```

### 1.2 Login
* **Method & URL Route:** `POST /api/auth/login`
* **Kebutuhan Akses Token:** Public
* **Contoh Request Body (JSON):**
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
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "user": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "name": "Rafael Pransa",
        "role": "customer"
      }
    }
  }
  ```

---

## 📂 2. Travel Regular Service

### 2.1 Get Schedules
* **Method & URL Route:** `GET /api/travel/schedules`
* **Kebutuhan Akses Token:** Public
* **Contoh Response Success (200 OK):**
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": "sch-uuid-1",
        "origin": "Ciamis",
        "destination": "Jakarta",
        "base_price": "250000.00",
        "departure_time": "2026-06-15T08:00:00.000Z",
        "available_seats": 5
      }
    ]
  }
  ```

### 2.2 Create Booking (Pilih Kursi)
* **Method & URL Route:** `POST /api/travel/bookings`
* **Kebutuhan Akses Token:** Butuh Bearer Token JWT (Role: `customer`)
* **Contoh Request Body (JSON):**
  ```json
  {
    "schedule_id": "sch-uuid-1",
    "seat_number": 3
  }
  ```
* **Contoh Response Success (201 Created):**
  ```json
  {
    "status": "success",
    "message": "Booking berhasil dibuat. Kursi dikunci selama 10 menit. Segera lakukan pembayaran.",
    "data": {
      "booking_id": "book-uuid-1",
      "seat_number": 3,
      "status": "locked"
    }
  }
  ```

### 2.3 Get Driver Manifest
* **Method & URL Route:** `GET /api/travel/manifest/:schedule_id`
* **Kebutuhan Akses Token:** Butuh Bearer Token JWT (Role: `driver`, `super_admin`)
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

## 📂 3. Charter (Pariwisata) Service

### 3.1 Request Charter
* **Method & URL Route:** `POST /api/charter/request`
* **Kebutuhan Akses Token:** Butuh Bearer Token JWT (Role: `customer`)
* **Contoh Request Body (JSON):**
  ```json
  {
    "car_type": "Luxio",
    "destination": "Pangandaran",
    "departure_date": "2026-07-01",
    "return_date": "2026-07-02",
    "notes": "Tolong supir yang ramah dan tidak merokok"
  }
  ```
* **Contoh Response Success (201 Created):**
  ```json
  {
    "status": "success",
    "message": "Pengajuan charter berhasil dibuat. Silakan lakukan pembayaran.",
    "data": {
      "car_type": "Luxio",
      "destination": "Pangandaran",
      "offered_price": 2400000,
      "total_days": 2,
      "status": "pending"
    }
  }
  ```

### 3.2 Get Charter History
* **Method & URL Route:** `GET /api/charter/history`
* **Kebutuhan Akses Token:** Butuh Bearer Token JWT (Role: `customer`, `super_admin`)
* **Contoh Response Success (200 OK):**
  ```json
  {
    "status": "success",
    "data": [
      {
        "id": "charter-uuid-1",
        "destination": "Pangandaran",
        "offered_price": "2400000.00",
        "status": "pending",
        "customer_name": "Rafael Pransa"
      }
    ]
  }
  ```

### 3.3 Verify Charter Payment
* **Method & URL Route:** `PUT /api/charter/:id/verify`
* **Kebutuhan Akses Token:** Butuh Bearer Token JWT (Role: `super_admin`)
* **Contoh Response Success (200 OK):**
  ```json
  {
    "status": "success",
    "message": "Pembayaran charter berhasil diverifikasi",
    "data": {
      "status": "paid"
    }
  }
  ```

---

## 📂 4. Package Shipment (Courier)

### 4.1 Create Shipment (Kirim Paket)
* **Method & URL Route:** `POST /api/packages/shipments`
* **Kebutuhan Akses Token:** Public (Opsional Bearer Token JWT)
* **Contoh Request Body (JSON):**
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
* **Contoh Response Success (201 Created):**
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
* **Method & URL Route:** `GET /api/packages/track/:waybill_number`
* **Kebutuhan Akses Token:** Public
* **Contoh Response Success (200 OK):**
  ```json
  {
    "status": "success",
    "data": {
      "waybill_number": "RTP-A1B2C3D4E5",
      "status": "on_transit",
      "sender_name": "Agus",
      "receiver_address": "Jl. Merdeka No.1, Jakarta"
    }
  }
  ```

### 4.3 Update Package Status
* **Method & URL Route:** `PUT /api/packages/shipments/:id/status`
* **Kebutuhan Akses Token:** Butuh Bearer Token JWT (Role: `driver`, `super_admin`)
* **Contoh Request Body (JSON):**
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
      "status": "on_transit"
    }
  }
  ```

---

## 📂 5. Driver Area

### 5.1 My Assigned Schedules & Manifest
* **Method & URL Route:** `GET /api/driver/schedules`
* **Kebutuhan Akses Token:** Butuh Bearer Token JWT (Role: `driver`)
* **Contoh Response Success (200 OK):**
  ```json
  {
    "status": "success",
    "message": "Berhasil mengambil daftar tugas supir",
    "data": [
      {
        "id": "sch-uuid-1",
        "origin": "Ciamis",
        "destination": "Jakarta",
        "departure_time": "2026-06-15T08:00:00.000Z",
        "status": "scheduled",
        "plate_number": "Z 1111 TA",
        "car_type": "Luxio",
        "passengers": [
          {
            "seat_number": 3,
            "passenger_name": "Budi",
            "passenger_phone": "081234",
            "booking_status": "paid"
          }
        ]
      }
    ]
  }
  ```

### 5.2 Update Trip Status
* **Method & URL Route:** `PUT /api/driver/schedules/:id/status`
* **Kebutuhan Akses Token:** Butuh Bearer Token JWT (Role: `driver`)
* **Contoh Request Body (JSON):**
  ```json
  {
    "status": "driving"
  }
  ```
* **Contoh Response Success (200 OK):**
  ```json
  {
    "status": "success",
    "message": "Status perjalanan berhasil diperbarui menjadi 'driving'"
  }
  ```

---

## 📂 6. Super Admin Area

### 6.1 Get Cashflow Summary (Laporan Keuangan)
* **Method & URL Route:** `GET /api/admin/cashflow/summary`
* **Kebutuhan Akses Token:** Butuh Bearer Token JWT (Role: `super_admin`)
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

### 6.2 Record Expense (Input Pengeluaran)
* **Method & URL Route:** `POST /api/admin/cashflow/expense`
* **Kebutuhan Akses Token:** Butuh Bearer Token JWT (Role: `super_admin`)
* **Contoh Request Body (JSON):**
  ```json
  {
    "amount": 150000,
    "category": "fuel",
    "description": "Isi bensin unit Luxio di Tol Cipularang"
  }
  ```
* **Contoh Response Success (201 Created):**
  ```json
  {
    "status": "success",
    "message": "Pengeluaran operasional berhasil dicatat"
  }
  ```

### 6.3 Master Data CRUD
*Semua endpoint Master Data berikut dikelola melalui controller dinamis. Anda bisa mengganti `/users` dengan `/fleets`, `/routes`, `/schedules`, `/banners`, atau `/destinations` sesuai kebutuhan.*

* **Method & URL Route:** `POST /api/admin/master/users`
* **Kebutuhan Akses Token:** Butuh Bearer Token JWT (Role: `super_admin`)
* **Contoh Request Body (JSON) (Contoh untuk membuat Driver):**
  ```json
  {
    "name": "Supir Baru",
    "email": "supirbaru@example.com",
    "password": "driver123",
    "phone_number": "081111222333",
    "role": "driver"
  }
  ```
* **Contoh Response Success (201 Created):**
  ```json
  {
    "status": "success",
    "message": "Data berhasil ditambahkan"
  }
  ```

### 6.4 Assign Driver & Fleet to Schedule
* **Method & URL Route:** `PUT /api/admin/master/schedules/:id/assign`
* **Kebutuhan Akses Token:** Butuh Bearer Token JWT (Role: `super_admin`)
* **Contoh Request Body (JSON):**
  ```json
  {
    "fleet_id": "fleet-uuid",
    "driver_id": "driver-uuid"
  }
  ```
* **Contoh Response Success (200 OK):**
  ```json
  {
    "status": "success",
    "message": "Berhasil menugaskan armada dan driver"
  }
  ```
