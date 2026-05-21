const express = require("express");
const cors = require("cors");
require("dotenv").config();

// Panggil file koneksi database yang baru dibuat
const db = require("./config/database");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Memanggil file routes yang baru dibuat
const carRoutes = require("./routes/carRoutes");
const bookingRoutes = require("./routes/bookingRoutes");

// Mendaftarkan route dengan awalan '/api/cars'
app.use("/api/cars", carRoutes);
// ----------------------------

// Mendaftarkan route dengan awalan '/api/cars'
app.use("/api/bookings", bookingRoutes);
// ----------------------------

app.get("/", (req, res) => {
  res.send("Halo! Server backend travel sudah berjalan.");
});

app.listen(port, () => {
  console.log(`Server backend berjalan di http://localhost:${port}`);
});
