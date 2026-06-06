const db = require('../config/db');

const getAssignedSchedules = async (driver_id) => {
  // Ambil data jadwal yang di-assign ke driver beserta detail rute dan mobil
  const schedules = await db('schedules')
    .join('routes', 'schedules.route_id', 'routes.id')
    .leftJoin('fleets', 'schedules.fleet_id', 'fleets.id')
    .select(
      'schedules.id',
      'schedules.departure_time',
      'schedules.status',
      'routes.origin',
      'routes.destination',
      'routes.base_price',
      'fleets.plate_number',
      'fleets.car_type',
      'fleets.seat_capacity'
    )
    .where('schedules.driver_id', driver_id)
    .orderBy('schedules.departure_time', 'asc');
    
  // Embed data manifest (daftar penumpang) untuk setiap jadwal
  for (let schedule of schedules) {
    const manifest = await db('travel_bookings')
      .join('users', 'travel_bookings.user_id', 'users.id')
      .select(
        'travel_bookings.seat_number',
        'users.name as passenger_name',
        'users.phone_number as passenger_phone',
        'travel_bookings.booking_status'
      )
      .where('travel_bookings.schedule_id', schedule.id)
      .whereIn('travel_bookings.booking_status', ['paid', 'prepaid'])
      .orderBy('travel_bookings.seat_number', 'asc');
      
    schedule.passengers = manifest;
  }

  return schedules;
};

const updateScheduleStatus = async (id, driver_id, status) => {
  const [updated] = await db('schedules')
    .where({ id, driver_id }) // Otorisasi internal: Driver hanya bisa update jadwal miliknya
    .update({ status })
    .returning('*');
  return updated;
};

module.exports = {
  getAssignedSchedules,
  updateScheduleStatus
};
