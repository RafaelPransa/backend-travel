const express = require("express");
const router = express.Router();

// Memanggil bookingController
const bookingController = require("../controllers/bookingController");

// Membuat rute GET untuk alamat '/'
// Nanti URL aslinya akan menjadi: http://localhost:3000/api/bookings
// Route Admin untuk melihat semua pesanan
router.get("/", bookingController.getAllBookings);

// Route untuk pelanggan membuat pesanan baru
router.post("/", bookingController.createBooking);

// Route untuk pelanggan membuat pesanan baru
router.put("/:id/status", bookingController.updateBookingStatus);

module.exports = router;
