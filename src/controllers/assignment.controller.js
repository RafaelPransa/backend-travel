const db = require("../config/db");

const getPendingAssignments = async (req, res) => {
  try {
    // 1. Ambil jadwal Rute yang butuh supir
    const routeSchedules = await db("schedules")
      .join("routes", "schedules.route_id", "routes.id")
      .leftJoin("fleets", "schedules.fleet_id", "fleets.id")
      .select(
        "schedules.id",
        "schedules.departure_time as departure_date",
        "schedules.fleet_id",
        "fleets.car_type as fleet_car_type",
        "fleets.plate_number as fleet_plate_number",
        "fleets.capacity as fleet_capacity",
        "routes.origin",
        "routes.destination"
      )
      .whereNull("schedules.driver_id")
      .where("schedules.departure_time", ">=", new Date().toISOString().split("T")[0])
      .orderBy("schedules.departure_time", "asc");

    // Hitung total penumpang untuk tiap jadwal rute
    const enrichedRoutes = await Promise.all(routeSchedules.map(async (sched) => {
      const [{ count }] = await db("travel_bookings")
        .where("schedule_id", sched.id)
        .whereNotIn("booking_status", ["dibatalkan", "ditolak"])
        .count("id as count");

      return {
        id: sched.id,
        type: "RUTE",
        title: `Travel Reguler: ${sched.origin} ? ${sched.destination}`,
        departure_date: sched.departure_date,
        fleet_id: sched.fleet_id,
        fleet_car_type: sched.fleet_car_type,
        fleet_plate_number: sched.fleet_plate_number,
        fleet_capacity: sched.fleet_capacity,
        total_passengers: parseInt(count, 10)
      };
    }));

    // 2. Ambil jadwal Charter yang butuh supir
    const charterBookings = await db("charter_bookings")
      .leftJoin("fleets", "charter_bookings.fleet_id", "fleets.id")
      .join("users", "charter_bookings.user_id", "users.id")
      .select(
        "charter_bookings.id",
        "charter_bookings.departure_date",
        "charter_bookings.return_date",
        "charter_bookings.destination",
        "charter_bookings.fleet_id",
        "fleets.car_type as fleet_car_type",
        "fleets.plate_number as fleet_plate_number",
        "fleets.capacity as fleet_capacity",
        "users.name as customer_name"
      )
      .whereNull("charter_bookings.driver_id")
      .whereIn("charter_bookings.status", ["dibayar", "menunggu_penjemputan", "dalam_penjemputan", "disetujui"])
      .orderBy("charter_bookings.departure_date", "asc");

    const enrichedCharters = charterBookings.map(c => ({
      id: c.id,
      type: "CHARTER",
      title: `Charter: ${c.customer_name} ? ${c.destination}`,
      departure_date: c.departure_date,
      return_date: c.return_date,
      fleet_id: c.fleet_id,
      fleet_car_type: c.fleet_car_type,
      fleet_plate_number: c.fleet_plate_number,
      fleet_capacity: c.fleet_capacity,
      total_passengers: 0 
    }));

    // 3. Gabungkan dan sort
    const allPending = [...enrichedRoutes, ...enrichedCharters].sort((a, b) => 
      new Date(a.departure_date) - new Date(b.departure_date)
    );

    res.status(200).json({
      status: "success",
      data: allPending
    });
  } catch (error) {
    console.error("Error getPendingAssignments:", error);
    res.status(500).json({ status: "error", message: "Terjadi kesalahan pada server" });
  }
};

const assignDriver = async (req, res) => {
  const { type, id } = req.params;
  const { driver_id, driver_2_id, pickup_time, fleet_id } = req.body;

  try {
    if (!driver_id) {
      return res.status(400).json({ status: "error", message: "Supir utama harus dipilih" });
    }

    if (type === "RUTE") {
      const updatePayload = {
        driver_id,
        driver_2_id: driver_2_id || null,
        status: "on_going"
      };
      if (fleet_id) updatePayload.fleet_id = fleet_id;

      await db("schedules")
        .where({ id })
        .update(updatePayload);

      if (pickup_time) {
        // Update ETA for everyone
        await db("travel_bookings")
          .where({ schedule_id: id })
          .update({ eta: pickup_time });
      }
      
      // Only change status to dalam_penjemputan for bookings that are ready (paid/confirmed)
      await db("travel_bookings")
        .where({ schedule_id: id })
        .whereIn("booking_status", ["menunggu_penjemputan", "dibayar"])
        .update({ booking_status: "dalam_penjemputan" });
      
    } else if (type === "CHARTER") {
      const updatePayload = {
        driver_id,
        driver_2_id: driver_2_id || null,
        status: "dalam_penjemputan"
      };
      if (fleet_id) updatePayload.fleet_id = fleet_id;

      await db("charter_bookings")
        .where({ id })
        .update(updatePayload);
    } else {
      return res.status(400).json({ status: "error", message: "Tipe pesanan tidak valid" });
    }

    res.status(200).json({
      status: "success",
      message: "Penugasan berhasil disimpan"
    });
  } catch (error) {
    console.error("Error assignDriver:", error);
    res.status(500).json({ status: "error", message: "Terjadi kesalahan pada server" });
  }
};

const { getAvailableFleets } = require('../helpers/fleetAvailability');

const getAvailableReplacementFleets = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    if (!start_date) {
      return res.status(400).json({ status: 'error', message: 'start_date diperlukan' });
    }
    
    // Cari semua tipe armada (car_type = null)
    const available = await getAvailableFleets(null, start_date, end_date || start_date);
    
    return res.status(200).json({
      status: 'success',
      data: available
    });
  } catch (error) {
    console.error('Error getAvailableReplacementFleets:', error);
    return res.status(500).json({ status: 'error', message: 'Gagal mengambil armada pengganti' });
  }
};

module.exports = {
  getPendingAssignments,
  assignDriver,
  getAvailableReplacementFleets
};
