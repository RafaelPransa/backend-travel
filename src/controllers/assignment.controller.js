const db = require("../config/db");
const { getAvailableFleets } = require('../helpers/fleetAvailability');

const getAssignments = async (req, res) => {
  const phase = req.query.phase || 'pending'; // pending, active, completed

  try {
    const routeSchedulesQuery = db("schedules")
      .join("routes", "schedules.route_id", "routes.id")
      .leftJoin("fleets", "schedules.fleet_id", "fleets.id")
      .select(
        "schedules.id",
        "schedules.departure_time as departure_date",
        "schedules.fleet_id",
        "fleets.car_type as fleet_car_type",
        "fleets.plate_number as fleet_plate_number",
        "fleets.seat_capacity as fleet_capacity",
        "routes.origin",
        "routes.destination"
      );

    if (phase === 'pending') {
      routeSchedulesQuery.whereNull('schedules.driver_id')
        .where('schedules.departure_time', '>=', new Date().toISOString().split('T')[0]);
    } else if (phase === 'active') {
      routeSchedulesQuery.whereNotNull('schedules.driver_id')
        .whereIn('schedules.status', ['scheduled', 'on_going', 'departed']);
    } else if (phase === 'completed') {
      routeSchedulesQuery.where('schedules.status', 'completed');
    }

    const routeSchedules = await routeSchedulesQuery;

    const enrichedRoutes = await Promise.all(routeSchedules.map(async (sched) => {
      // Get travel_bookings
      const travelBookings = await db('travel_bookings')
        .where('schedule_id', sched.id)
        .whereNotIn('booking_status', ['dibatalkan', 'ditolak']);
      
      const total_passengers = travelBookings.length;
      const passenger_revenue = travelBookings.reduce((sum, b) => sum + (parseFloat(b.price) || 0), 0);

      // Get package_shipments
      let package_revenue = 0;
      let total_packages = 0;
      if (sched.fleet_id && sched.departure_date) {
        const depDate = new Date(sched.departure_date).toISOString().split('T')[0];
        const packages = await db('package_shipments')
          .where('fleet_id', sched.fleet_id)
          .whereRaw('DATE(departure_date) = ?', [depDate])
          .whereNotIn('status', ['dibatalkan', 'ditolak', 'REJECTED']);
        
        total_packages = packages.length;
        package_revenue = packages.reduce((sum, p) => sum + (parseFloat(p.total_price) || 0), 0);
      }

      return {
        id: sched.id,
        type: "RUTE",
        title: `Travel Reguler: ${sched.origin} ➔ ${sched.destination}`,
        departure_date: sched.departure_date,
        fleet_id: sched.fleet_id,
        fleet_car_type: sched.fleet_car_type,
        fleet_plate_number: sched.fleet_plate_number,
        fleet_capacity: sched.fleet_capacity,
        total_passengers,
        total_packages,
        total_revenue: passenger_revenue + package_revenue
      };
    }));

    // CHARTER
    const charterQuery = db("charter_bookings")
      .leftJoin("fleets", "charter_bookings.fleet_id", "fleets.id")
      .join("users", "charter_bookings.user_id", "users.id")
      .select(
        "charter_bookings.id",
        "charter_bookings.departure_date",
        "charter_bookings.return_date",
        "charter_bookings.destination",
        "charter_bookings.fleet_id",
        "charter_bookings.offered_price as total_price",
        "fleets.car_type as fleet_car_type",
        "fleets.plate_number as fleet_plate_number",
        "fleets.seat_capacity as fleet_capacity",
        "users.name as customer_name"
      );

    if (phase === 'pending') {
      charterQuery.whereNull('charter_bookings.driver_id')
        .whereIn('charter_bookings.status', ['dibayar', 'menunggu_penjemputan', 'dalam_penjemputan', 'disetujui']);
    } else if (phase === 'active') {
      charterQuery.whereNotNull('charter_bookings.driver_id')
        .whereIn('charter_bookings.status', ['dalam_penjemputan', 'on_going']);
    } else if (phase === 'completed') {
      charterQuery.whereIn('charter_bookings.status', ['selesai_final', 'selesai', 'completed']);
    }

    const charterBookings = await charterQuery;

    const enrichedCharters = charterBookings.map(c => ({
      id: c.id,
      type: "CHARTER",
      title: `Charter: ${c.customer_name} ➔ ${c.destination}`,
      customer_name: c.customer_name,
      departure_date: c.departure_date,
      return_date: c.return_date,
      fleet_id: c.fleet_id,
      fleet_car_type: c.fleet_car_type,
      fleet_plate_number: c.fleet_plate_number,
      fleet_capacity: c.fleet_capacity,
      total_passengers: 0,
      total_packages: 0,
      total_revenue: parseFloat(c.total_price) || 0
    }));

    const allAssignments = [...enrichedRoutes, ...enrichedCharters].sort((a, b) => 
      new Date(a.departure_date) - new Date(b.departure_date)
    );

    res.status(200).json({
      status: "success",
      data: allAssignments
    });
  } catch (error) {
    console.error("Error getAssignments:", error);
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
        status: "scheduled"
      };
      if (fleet_id) updatePayload.fleet_id = fleet_id;

      await db("schedules")
        .where({ id })
        .update(updatePayload);

      if (pickup_time) {
        await db("travel_bookings")
          .where({ schedule_id: id })
          .update({ eta: pickup_time });
      }
      
      await db("travel_bookings")
        .where({ schedule_id: id })
        .whereIn("booking_status", ["menunggu_penjemputan", "dibayar", "selesai"])
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

const getAvailableReplacementFleets = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    if (!start_date) {
      return res.status(400).json({ status: 'error', message: 'start_date diperlukan' });
    }
    
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

const rejectAssignment = async (req, res) => {
  const { type, id } = req.params;
  
  try {
    await db.transaction(async (trx) => {
      if (type === "RUTE") {
        const schedule = await trx('schedules').where({ id }).first();
        if(!schedule) return res.status(404).json({ status: 'error', message: 'Jadwal tidak ditemukan' });

        await trx('schedules').where({ id }).update({ status: 'dibatalkan', driver_id: null });
        await trx('travel_bookings').where({ schedule_id: id }).update({ booking_status: 'dibatalkan' });
        
        if (schedule.fleet_id && schedule.departure_time) {
          const depDate = new Date(schedule.departure_time).toISOString().split('T')[0];
          await trx('package_shipments')
            .where('fleet_id', schedule.fleet_id)
            .whereRaw('DATE(departure_date) = ?', [depDate])
            .update({ status: 'dibatalkan' });
        }
      } else if (type === "CHARTER") {
        await trx('charter_bookings').where({ id }).update({ status: 'dibatalkan', driver_id: null });
      }
    });

    res.status(200).json({ status: "success", message: "Penugasan dan pesanan berhasil dibatalkan" });
  } catch (error) {
    console.error("Error rejectAssignment:", error);
    res.status(500).json({ status: "error", message: "Gagal membatalkan penugasan" });
  }
};

const changeFleet = async (req, res) => {
  const { type, id } = req.params;
  const { fleet_id } = req.body;

  if(!fleet_id) return res.status(400).json({ status: 'error', message: 'fleet_id diperlukan' });

  try {
    await db.transaction(async (trx) => {
      if (type === "RUTE") {
        const oldSchedule = await trx('schedules').where({ id }).first();
        await trx('schedules').where({ id }).update({ fleet_id });

        if (oldSchedule && oldSchedule.fleet_id && oldSchedule.departure_time) {
          const depDate = new Date(oldSchedule.departure_time).toISOString().split('T')[0];
          await trx('package_shipments')
            .where('fleet_id', oldSchedule.fleet_id)
            .whereRaw('DATE(departure_date) = ?', [depDate])
            .whereNotIn('status', ['dibatalkan', 'ditolak', 'REJECTED'])
            .update({ fleet_id });
        }
      } else if (type === "CHARTER") {
        await trx('charter_bookings').where({ id }).update({ fleet_id });
      }
    });

    res.status(200).json({ status: "success", message: "Armada berhasil diganti" });
  } catch (error) {
    console.error("Error changeFleet:", error);
    res.status(500).json({ status: "error", message: "Gagal mengganti armada" });
  }
};

module.exports = {
  getAssignments,
  assignDriver,
  getAvailableReplacementFleets,
  rejectAssignment,
  changeFleet
};
