const express = require("express");
const router = express.Router();

// Memanggil controller yang baru saja kita buat
const carController = require("../controllers/carController");

// Membuat rute GET untuk alamat '/'
// Nanti URL aslinya akan menjadi: http://localhost:3000/api/cars
router.get("/", carController.getAllCars);
router.get("/:id", carController.getCarById);

module.exports = router;
