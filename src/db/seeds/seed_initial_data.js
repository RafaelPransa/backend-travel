const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  // 1. Hapus data dengan urutan yang benar (child ke parent) untuk menghindari Foreign Key constraint errors
  await knex('cashflows').del();
  await knex('package_shipments').del();
  await knex('charter_bookings').del();
  await knex('travel_bookings').del();
  await knex('schedules').del();
  await knex('routes').del();
  await knex('fleets').del();
  await knex('users').del();

  // 2. Hash Password
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('admin123', salt);
  const driverPassword = await bcrypt.hash('driver123', salt);

  // 3. Masukkan Data Users
  await knex('users').insert([
    {
      name: 'Super Admin RTP',
      email: 'admin@rinitransputri.com',
      password: adminPassword,
      phone_number: '08111111111',
      role: 'super_admin'
    },
    {
      name: 'Asep',
      email: 'asep@gmail.com',
      password: driverPassword,
      phone_number: '08222222222',
      role: 'driver'
    },
    {
      name: 'Budi',
      email: 'budi@gmail.com',
      password: driverPassword,
      phone_number: '08333333333',
      role: 'driver'
    }
  ]);

  // 4. Masukkan Data Fleets
  await knex('fleets').insert([
    {
      plate_number: 'Z 1111 TA',
      car_type: 'Luxio',
      seat_capacity: 6
    },
    {
      plate_number: 'Z 2222 TB',
      car_type: 'Elf',
      seat_capacity: 12
    }
  ]);

  // 5. Masukkan Data Routes
  await knex('routes').insert([
    {
      origin: 'Ciamis',
      destination: 'Jakarta',
      base_price: 250000
    },
    {
      origin: 'Jakarta',
      destination: 'Ciamis',
      base_price: 250000
    }
  ]);
};
