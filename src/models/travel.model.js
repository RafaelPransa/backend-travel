const db = require('../config/db');
const { isJabodetabek } = require('../utils/jabodetabek');
const { getAvailableFleets } = require('../helpers/fleetAvailability');

// --- DYNAMIC SEAT & FLEET LOGIC ---
const calculateLoad = async (route_id, dateString) => {
  // Cek apakah jadwal sudah ada
  const schedule = await db('schedules')
    .where('route_id', route_id)
    .whereRaw('DATE(departure_time) = ?', [dateString])
    .whereNotIn('status', ['dibatalkan'])
    .first();

  let used_seats = 0;
  let occupied_seats_list = [];

  // PENTING: Dapatkan availableFleets DAHULU sebelum evaluasi paket
  let availableFleets = [];
  try {
    availableFleets = await getAvailableFleets(
      null,
      dateString,
      dateString,
      null,
      schedule ? schedule.id : null
    );
  } catch (err) {
    console.error("Error fetching available fleets in calculateLoad:", err);
  }

  let extraSeatsCount = 0;
  let passenger_seats_count = 0;

  if (schedule) {
    // 1. Hitung beban dari Travel Reguler
    const travelBookings = await db('travel_bookings')
      .where('schedule_id', schedule.id)
      .where(function () {
        this.whereIn('booking_status', ['selesai', 'selesai_final', 'menunggu_konfirmasi', 'menunggu_penjemputan', 'dalam_penjemputan', 'dalam_perjalanan', 'dibayar'])
          .orWhere(function () {
            this.where('booking_status', 'menunggu_pembayaran')
              .andWhere('locked_until', '>', db.fn.now());
          });
      });

    travelBookings.forEach(b => {
      used_seats += 1;
      occupied_seats_list.push(b.seat_number);
      if (b.baggage_weight >= 60 || b.baggage_dimension === 'super_besar') {
        extraSeatsCount += 1;
      }
    });
    passenger_seats_count = travelBookings.length + extraSeatsCount;
  }

  used_seats += extraSeatsCount;

  // 2. Hitung beban dari Paket (Package Shipments)
  let packagesQuery = db('package_shipments')
    .where('departure_date', dateString)
    .whereNotIn('status', ['delivered', 'dibatalkan', 'ditolak']);

  if (schedule && schedule.fleet_id) {
    packagesQuery = packagesQuery.where('fleet_id', schedule.fleet_id);
  } else if (availableFleets.length > 0) {
    // Jika belum ada jadwal (mock load), cek paket pada armada mock yang akan terpilih
    packagesQuery = packagesQuery.where('fleet_id', availableFleets[0].id);
  } else {
    packagesQuery = packagesQuery.where('route_id', route_id);
  }

  const packages = await packagesQuery;

  let total_package_weight = 0;
  packages.forEach(p => {
    total_package_weight += parseFloat(p.weight || 0);

    let seats = [];
    try {
      seats = typeof p.seat_numbers === 'string' ? JSON.parse(p.seat_numbers) : (p.seat_numbers || []);
    } catch (e) {
      seats = [];
    }

    if (seats.length > 0) {
      seats.forEach(seat => {
        occupied_seats_list.push(seat);
        used_seats += 1;
      });
    } else {
      let packageSeats = (p.seat_qty || 1);
      if (p.weight >= 60 || p.dimension === 'super_besar') {
        packageSeats += 1;
      }
      used_seats += packageSeats;
      extraSeatsCount += packageSeats; // Tambahkan ke extraSeatsCount agar diblokir visual dari belakang
    }
  });

  // 3. Evaluasi Unit secara dinamis
  let unit = 'Tidak ada armada tersedia';
  let max_capacity = 0;

  if (availableFleets.length > 0) {
    // Cari armada terkecil yang bisa memuat used_seats
    const singleFleet = availableFleets.find(f => f.seat_capacity >= used_seats);
    if (singleFleet) {
      unit = singleFleet.car_type;
      max_capacity = singleFleet.seat_capacity;
    } else {
      // Jika kapasitas penumpang lebih besar dari armada terbesar yang ada
      const largestFleet = availableFleets[availableFleets.length - 1];
      const neededUnits = Math.ceil(used_seats / largestFleet.seat_capacity);

      if (neededUnits > availableFleets.length) {
        // Hanya gunakan unit yang benar-benar tersedia di database
        unit = availableFleets.length === 1 ? availableFleets[0].car_type : `${availableFleets.length} Armada Gabungan`;
        max_capacity = availableFleets.reduce((sum, f) => sum + f.seat_capacity, 0);
      } else {
        unit = `${largestFleet.car_type} (${neededUnits} Unit)`;
        max_capacity = largestFleet.seat_capacity * neededUnits;
      }
    }
  } else {
    // Fallback jika semua armada disewa/dipakai layanan lain
    unit = 'Armada Penuh/Disewa';
    max_capacity = 0;
  }

  // Secara dinamis memblokir kursi untuk barang bawaan penumpang dari kursi paling belakang
  if (extraSeatsCount > 0 && max_capacity > 0) {
    let blocked = 0;
    for (let i = max_capacity; i >= 1; i--) {
      if (!occupied_seats_list.includes(i)) {
        occupied_seats_list.push(i);
        blocked++;
        if (blocked === extraSeatsCount) break;
      }
    }
  }

  // Dapatkan armada terhubung untuk mendapatkan max_payload
  let active_fleet = null;
  if (schedule && schedule.fleet_id) {
    active_fleet = await db('fleets').where('id', schedule.fleet_id).first();
  } else if (availableFleets.length > 0) {
    const singleFleet = availableFleets.find(f => f.seat_capacity >= used_seats);
    active_fleet = singleFleet || availableFleets[availableFleets.length - 1];
  }
  const max_payload = active_fleet ? active_fleet.max_payload : 1450;
  const total_weight = (passenger_seats_count * 110) + total_package_weight;

  let status = (used_seats >= max_capacity || total_weight >= max_payload) ? 'full' : 'available';

  // FIX: Jika jadwal sudah ditugaskan ke supir dan statusnya sedang bertugas/berangkat,
  // paksa status menjadi 'full' agar tidak muncul di pilihan ketersediaan jadwal.
  // (Jadwal yang hanya berstatus 'scheduled' tetap available meski driver_id sudah ada)
  if (schedule && ['on_going', 'departed', 'completed', 'sedang_bertugas'].includes(schedule.status)) {
    status = 'full';
    used_seats = max_capacity; // Set agar sisa_kursi menjadi 0 secara matematis
  }

  return {
    id: schedule ? schedule.id : "",
    status,
    sisa_kursi: Math.max(0, max_capacity - used_seats),
    unit,
    max_capacity,
    used_seats,
    occupied_seats_list,
    schedule_id: schedule ? schedule.id : null,
    total_weight,
    max_payload
  };
};

const getSchedulesAvailability = async (route_id) => {
  const route = await db('routes').where('id', route_id).first();
  if (!route) return [];

  const dates = [];
  const today = new Date();
  const originLower = route.origin.toLowerCase();
  // Logika hari buka operasional
  const allowedDays = originLower.includes("panawangan") ? [1, 3, 5] : [2, 4, 6, 0];

  const currentHour = today.getHours();

  for (let i = 0; i < 14; i++) {
    if (i === 0 && currentHour >= 14) continue;

    const nextDate = new Date();
    nextDate.setDate(today.getDate() + i);

    if (allowedDays.includes(nextDate.getDay())) {
      // Pastikan format YYYY-MM-DD menggunakan tanggal lokal, bukan UTC
      const yyyy = nextDate.getFullYear();
      const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
      const dd = String(nextDate.getDate()).padStart(2, '0');
      const dateString = `${yyyy}-${mm}-${dd}`;

      // Cek ketersediaan armada global
      const availableFleets = await getAvailableFleets(null, dateString, dateString);

      const loadInfo = await calculateLoad(route_id, dateString);

      // Tampilkan hanya jika masih ada kursi kosong di jadwal (kalau ada jadwal) ATAU armada tersedia
      if (loadInfo.status !== 'full' && (availableFleets.length > 0 || loadInfo.max_capacity > 0)) {
        dates.push({
          date: dateString,
          departure_time: nextDate.toISOString(),
          ...loadInfo,
          base_price: route.base_price
        });
      }
    }
  }
  return dates;
};

const getSeatsOccupancy = async (route_id, date) => {
  return await calculateLoad(route_id, date);
};

// --- LOGIKA LAMA (Dipertahankan agar tidak break dependency) ---
const getSchedules = async ({ date, origin, destination }) => {
  let query = db('schedules')
    .join('routes', 'schedules.route_id', 'routes.id')
    .join('fleets', 'schedules.fleet_id', 'fleets.id')
    .select(
      'schedules.id', 'routes.origin', 'routes.destination', 'routes.base_price',
      'schedules.departure_time', 'schedules.status', 'fleets.plate_number',
      'fleets.car_type', 'fleets.seat_capacity'
    )
    .where('schedules.status', 'scheduled')
    .where('fleets.status', 'active');

  if (origin) query = query.where('routes.origin', origin);
  if (destination) query = query.where('routes.destination', destination);
  if (date) query = query.whereRaw('DATE(schedules.departure_time) = ?', [date]);

  const schedules = await query;
  if (schedules.length === 0) return schedules;

  const scheduleIds = schedules.map(s => s.id);
  const bookings = await db('travel_bookings')
    .whereIn('schedule_id', scheduleIds)
    .where(function () {
      this.whereIn('booking_status', ['selesai', 'selesai_final', 'menunggu_konfirmasi', 'menunggu_penjemputan', 'dalam_penjemputan', 'dalam_perjalanan', 'dibayar'])
        .orWhere(function () {
          this.where('booking_status', 'menunggu_pembayaran')
            .andWhere('locked_until', '>', db.fn.now());
        });
    })
    .select('schedule_id')
    .count('id as total')
    .groupBy('schedule_id');

  const bookingCounts = {};
  bookings.forEach(b => { bookingCounts[b.schedule_id] = parseInt(b.total, 10); });

  return schedules.map(schedule => {
    const occupied = bookingCounts[schedule.id] || 0;
    return { ...schedule, available_seats: schedule.seat_capacity - occupied };
  });
};

const checkSeatAvailability = async (schedule_id, seat_number) => {
  const existingBooking = await db('travel_bookings')
    .where({ schedule_id, seat_number })
    .where(function () {
      this.whereIn('booking_status', ['selesai', 'selesai_final', 'menunggu_konfirmasi', 'menunggu_penjemputan', 'dalam_penjemputan', 'dalam_perjalanan', 'dibayar'])
        .orWhere(function () {
          this.where('booking_status', 'menunggu_pembayaran')
            .andWhere('locked_until', '>', db.fn.now());
        });
    }).first();

  if (existingBooking) return false;

  // Cek apakah kursi tersebut di-lock secara dinamis untuk alokasi barang bawaan penumpang lain
  const schedule = await db('schedules').where('id', schedule_id).first();
  if (schedule) {
    const d = new Date(schedule.departure_time);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateString = `${yyyy}-${mm}-${dd}`;

    // Gunakan calculateLoad untuk mendapatkan daftar lengkap kursi yang di-lock (booking + baggage + paket)
    const loadInfo = await calculateLoad(schedule.route_id, dateString);
    if (loadInfo.occupied_seats_list.includes(parseInt(seat_number, 10))) {
      return false;
    }
  }

  return true;
};

const createBooking = async (data) => {
  let schedule_id = data.schedule_id;
  let target_route_id = data.route_id;

  // Resolve target_route_id if only schedule_id is provided
  if (schedule_id && !target_route_id) {
    const s = await db('schedules').where('id', schedule_id).first();
    if (s) target_route_id = s.route_id;
  }

  let depDate = data.departure_date;
  if (!depDate && schedule_id) {
    const s = await db('schedules').where('id', schedule_id).first();
    if (s) {
      const d = new Date(s.departure_time);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      depDate = `${yyyy}-${mm}-${dd}`;
    }
  }

  // Support backward compatibility (if single passenger format is sent)
  let passengers = data.passengers;
  if (!passengers && data.seat_number) {
    passengers = [{
      seat_number: data.seat_number,
      passenger_name: data.passenger_name || 'Penumpang Utama',
      baggage_description: data.baggage_description || null,
      baggage_weight: data.baggage_weight || null,
      baggage_dimension: data.baggage_dimension || null
    }];
  }

  if (!passengers || passengers.length === 0) {
    throw new Error('Data penumpang tidak valid');
  }

  // 1. Hitung total jatah berat & ekstra kursi untuk seluruh grup
  let totalRequiredSeats = passengers.length;
  let totalExtraSeats = 0;
  let accumulativeWeight = 0;

  passengers.forEach(p => {
    let extraSeats = 0;
    const weight = parseFloat(p.baggage_weight || 0);
    if (weight >= 60 || p.baggage_dimension === 'super_besar') {
      extraSeats = 1;
    }
    totalExtraSeats += extraSeats;
    accumulativeWeight += (1 + extraSeats) * 110;
  });

  totalRequiredSeats += totalExtraSeats;

  // 2. Validasi Batas Payload Armada secara akumulatif
  if (target_route_id && depDate) {
    const loadInfo = await calculateLoad(target_route_id, depDate);
    if (loadInfo.max_payload > 0 && (loadInfo.total_weight + accumulativeWeight) > loadInfo.max_payload) {
      const error = new Error(`Beban kargo armada sudah penuh pada tanggal tersebut. Sisa kapasitas tidak mencukupi untuk seluruh penumpang & bagasi.`);
      error.code = 'EXCEED_MAX_PAYLOAD';
      throw error;
    }
  }

  // 3. Validasi Ketersediaan Kursi secara akumulatif
  if (target_route_id && depDate) {
    const loadInfo = await calculateLoad(target_route_id, depDate);
    if (loadInfo.sisa_kursi < totalRequiredSeats) {
      const error = new Error(`Sisa kursi di armada (Sisa ${loadInfo.sisa_kursi}) tidak cukup untuk jumlah penumpang Anda (Butuh ${totalRequiredSeats} kursi termasuk bagasi).`);
      error.code = 'NOT_ENOUGH_SEATS';
      throw error;
    }
  }

  // 4. Pastikan schedule sudah terbuat
  if (!schedule_id && data.route_id && data.departure_date) {
    const existingSchedule = await db('schedules')
      .where('route_id', data.route_id)
      .whereRaw('DATE(departure_time) = ?', [data.departure_date])
      .whereNotIn('status', ['dibatalkan'])
      .first();

    if (existingSchedule) {
      schedule_id = existingSchedule.id;
    } else {
      const departureTime = new Date(data.departure_date);
      departureTime.setHours(8, 0, 0, 0); // Default jam 8 pagi
      const availableFleets = await getAvailableFleets(null, data.departure_date, data.departure_date);

      if (availableFleets.length === 0) {
        const error = new Error('Tidak ada armada yang tersedia pada tanggal tersebut.');
        error.code = 'NO_FLEET_AVAILABLE';
        throw error;
      }

      const selectedFleet = availableFleets[0];
      const packageOnlySchedule = await db('schedules')
        .where('fleet_id', selectedFleet.id)
        .whereNull('route_id')
        .whereRaw('DATE(departure_time) = ?', [data.departure_date])
        .first();

      if (packageOnlySchedule) {
        const [updatedSchedule] = await db('schedules')
          .where('id', packageOnlySchedule.id)
          .update({ route_id: data.route_id })
          .returning('*');
        schedule_id = updatedSchedule.id;
      } else {
        const [newSchedule] = await db('schedules').insert({
          route_id: data.route_id,
          fleet_id: selectedFleet.id,
          departure_time: departureTime,
          status: 'scheduled'
        }).returning('*');
        schedule_id = newSchedule.id;
      }
    }
  }

  const schedule = await db('schedules')
    .join('routes', 'schedules.route_id', 'routes.id')
    .select('routes.base_price', 'schedules.departure_time')
    .where('schedules.id', schedule_id)
    .first();

  if (!schedule) throw new Error('Jadwal tidak ditemukan');

  const depTime = new Date(schedule.departure_time);
  const now = new Date();
  if (
    depTime.getFullYear() === now.getFullYear() &&
    depTime.getMonth() === now.getMonth() &&
    depTime.getDate() === now.getDate()
  ) {
    if (now.getHours() >= 14) {
      const error = new Error('Pemesanan untuk hari ini sudah ditutup (armada berangkat jam 15:00). Silakan pilih tanggal lain.');
      error.code = 'BOOKING_CLOSED_TODAY';
      throw error;
    }
  }

  // Generate Booking Code tunggal untuk grup ini
  const randomStr = Math.random().toString(36).substring(2, 7).toUpperCase();
  const datePrefix = depDate.replace(/-/g, '').substring(2); // Yymmdd
  const bookingCode = `TRV-${datePrefix}-${randomStr}`;

  // 5. Simpan semua baris booking dalam sebuah Transaksi Database
  const createdBookings = [];
  await db.transaction(async (trx) => {
    for (const passenger of passengers) {
      // Pengecekan kursi kosong double check
      const isAvailable = await trx('travel_bookings')
        .where({ schedule_id, seat_number: passenger.seat_number })
        .where(function () {
          this.whereIn('booking_status', ['selesai', 'selesai_final', 'menunggu_konfirmasi', 'menunggu_penjemputan', 'dalam_penjemputan', 'dalam_perjalanan', 'dibayar'])
            .orWhere(function () {
              this.where('booking_status', 'menunggu_pembayaran')
                .andWhere('locked_until', '>', db.fn.now());
            });
        }).first();

      if (isAvailable) {
        throw new Error(`Kursi nomor ${passenger.seat_number} sudah dipesan atau dikunci oleh pengguna lain.`);
      }

      let originalPrice = parseFloat(schedule.base_price);
      if (isNaN(originalPrice)) originalPrice = 250000;

      let finalPrice = originalPrice;
      let appliedPromoId = data.promo_id || null;
      let promoObj = null;

      try {
        let promoQuery = trx('promotions').where('is_active', true);
        if (appliedPromoId) {
          promoQuery = promoQuery.andWhere('id', appliedPromoId);
        }
        const promo = await promoQuery.first();
        if (promo) {
          if (promo.target_service.includes('all') || promo.target_service.includes('travel')) {
            appliedPromoId = promo.id;
            promoObj = promo;
            const discount = finalPrice * (parseFloat(promo.discount_percentage) / 100);
            finalPrice = finalPrice - discount;
          } else {
            appliedPromoId = null;
          }
        }
      } catch (err) {
        console.error("Error applying promo:", err);
      }

      let isBaggageCharge = false;
      const weight = parseFloat(passenger.baggage_weight || 0);
      if (weight >= 60.00 || passenger.baggage_dimension === 'super_besar') {
        isBaggageCharge = true;
        finalPrice += 250000.00;
        originalPrice += 250000.00;
      }

      let finalBookingStatus = 'menunggu_konfirmasi';
      if (data.tujuan_kecamatan && isJabodetabek(data.tujuan_kecamatan)) {
        finalBookingStatus = 'menunggu_pembayaran';
        originalPrice = 250000;
        finalPrice = 250000;
        if (isBaggageCharge) {
          finalPrice += 250000;
          originalPrice += 250000;
        }
        if (appliedPromoId && promoObj) {
          const discount = finalPrice * (parseFloat(promoObj.discount_percentage) / 100);
          finalPrice = finalPrice - discount;
        }
      }

      const [bookingRecord] = await trx('travel_bookings').insert({
        user_id: data.user_id,
        schedule_id: schedule_id,
        seat_number: passenger.seat_number,
        pickup_address: data.pickup_address,
        dropoff_address: data.dropoff_address,
        payment_method: data.payment_method || null,
        baggage_description: passenger.baggage_description || null,
        baggage_weight: passenger.baggage_weight || null,
        baggage_dimension: passenger.baggage_dimension || null,
        is_baggage_charge: isBaggageCharge,
        booking_status: finalBookingStatus,
        locked_until: db.raw("NOW() + INTERVAL '10 minutes'"),
        price: finalPrice,
        original_price: originalPrice,
        promo_id: appliedPromoId,
        booking_code: bookingCode,
        passenger_name: passenger.passenger_name || 'Penumpang'
      }).returning('*');

      createdBookings.push(bookingRecord);
    }
  });

  return createdBookings;
};

const getManifest = async (schedule_id) => {
  return db('travel_bookings')
    .join('users', 'travel_bookings.user_id', 'users.id')
    .select(
      'travel_bookings.seat_number', 'users.name', 'users.phone_number',
      'travel_bookings.booking_status', 'travel_bookings.pickup_address',
      'travel_bookings.dropoff_address', 'travel_bookings.baggage_description',
      'travel_bookings.baggage_weight', 'travel_bookings.baggage_dimension',
      'travel_bookings.is_baggage_charge'
    )
    .where('travel_bookings.schedule_id', schedule_id)
    .whereIn('travel_bookings.booking_status', ['selesai', 'dalam_penjemputan', 'dibayar'])
    .orderBy('travel_bookings.seat_number', 'asc');
};

const getTravelHistory = async (user_id) => {
  return db('travel_bookings')
    .join('schedules', 'travel_bookings.schedule_id', 'schedules.id')
    .join('routes', 'schedules.route_id', 'routes.id')
    .select(
      'travel_bookings.id as booking_id', 'travel_bookings.seat_number',
      'travel_bookings.booking_status', 'travel_bookings.pickup_address',
      'travel_bookings.dropoff_address', 'travel_bookings.baggage_description',
      'travel_bookings.baggage_weight', 'travel_bookings.baggage_dimension',
      'travel_bookings.is_baggage_charge', 'travel_bookings.created_at',
      'travel_bookings.price', 'travel_bookings.original_price',
      'travel_bookings.payment_method', 'travel_bookings.payment_proof_url',
      'travel_bookings.booking_code', 'travel_bookings.passenger_name',
      'routes.origin', 'routes.destination', 'schedules.departure_time',
      'schedules.status as schedule_status'
    )
    .where('travel_bookings.user_id', user_id)
    .where('travel_bookings.is_hidden', false)
    .orderBy('travel_bookings.created_at', 'desc');
};

const uploadPaymentProof = async (booking_id, user_id, file_url) => {
  const booking = await db('travel_bookings').where({ id: booking_id, user_id }).first();
  if (!booking) return null;

  const updateData = {
    payment_proof_url: file_url,
    payment_method: 'cashless',
    booking_status: 'menunggu_konfirmasi'
  };

  if (booking.booking_code) {
    await db('travel_bookings')
      .where({ booking_code: booking.booking_code, user_id })
      .update(updateData);
      
    return db('travel_bookings').where({ id: booking_id, user_id }).first();
  }

  const [updated] = await db('travel_bookings')
    .where({ id: booking_id, user_id })
    .whereIn('booking_status', ['menunggu_pembayaran', 'menunggu_konfirmasi'])
    .update(updateData)
    .returning('*');
  return updated;
};

const updatePaymentMethod = async (booking_id, user_id, payment_method) => {
  const booking = await db('travel_bookings').where({ id: booking_id, user_id }).first();
  if (!booking) return null;

  const updateData = { payment_method };
  // Jika memilih cash, status diset ke menunggu_konfirmasi agar Admin memvalidasi
  if (payment_method === 'cash') {
    updateData.booking_status = 'menunggu_konfirmasi';
  }

  if (booking.booking_code) {
    await db('travel_bookings')
      .where({ booking_code: booking.booking_code, user_id })
      .update(updateData);
      
    return db('travel_bookings').where({ id: booking_id, user_id }).first();
  }

  const [updated] = await db('travel_bookings')
    .where({ id: booking_id, user_id })
    .whereIn('booking_status', ['menunggu_pembayaran'])
    .update(updateData)
    .returning('*');
  return updated;
};

const cancelBooking = async (booking_id, user_id) => {
  const booking = await db('travel_bookings')
    .join('schedules', 'travel_bookings.schedule_id', 'schedules.id')
    .select('travel_bookings.booking_status', 'travel_bookings.booking_code', 'schedules.departure_time', 'schedules.id as schedule_id', 'schedules.fleet_id')
    .where('travel_bookings.id', booking_id)
    .andWhere('travel_bookings.user_id', user_id)
    .first();

  if (!booking) return null;

  if (['dibatalkan', 'ditolak', 'REJECTED'].includes(booking.booking_status)) {
    const error = new Error('Pesanan ini sudah dibatalkan sebelumnya.');
    error.code = 'ALREADY_CANCELLED';
    throw error;
  }

  if (!['selesai', 'COMPLETED', 'APPROVED', 'menunggu_pembayaran', 'menunggu_konfirmasi', 'dibayar'].includes(booking.booking_status)) {
    const error = new Error(`Pesanan dengan status ${booking.booking_status} tidak dapat dibatalkan oleh pelanggan.`);
    error.code = 'INVALID_STATUS';
    throw error;
  }

  if (['selesai', 'COMPLETED', 'APPROVED', 'dibayar'].includes(booking.booking_status)) {
    const departureTime = new Date(booking.departure_time);
    const deadline = new Date(departureTime);
    deadline.setHours(12, 0, 0, 0);

    const now = new Date();
    if (now > deadline) {
      const error = new Error('Pembatalan pesanan hanya dapat dilakukan sebelum pukul 12 Siang pada tanggal keberangkatan');
      error.code = 'CANCELLATION_TIMEOUT';
      throw error;
    }
  }

  let updatedRows = 0;
  let deleted = null;

  if (booking.booking_code) {
    updatedRows = await db('travel_bookings')
      .where({ booking_code: booking.booking_code, user_id })
      .update({ booking_status: 'dibatalkan' });
      
    deleted = await db('travel_bookings').where({ id: booking_id, user_id }).first();
  } else {
    const [del] = await db('travel_bookings')
      .where({ id: booking_id, user_id })
      .update({ booking_status: 'dibatalkan' })
      .returning('*');
    deleted = del;
    updatedRows = deleted ? 1 : 0;
  }

  if (updatedRows > 0) {
    // Auto-cleanup schedule jika tidak ada penumpang aktif lagi
    const activeBookings = await db('travel_bookings')
      .where('schedule_id', booking.schedule_id)
      .whereNotIn('booking_status', ['dibatalkan', 'ditolak', 'REJECTED']);

    if (activeBookings.length === 0) {
      // Hanya hapus jika tidak ada paket yang menggunakan armada di hari yang sama
      const activePackages = await db('package_shipments')
        .where('fleet_id', booking.fleet_id || null)
        .whereRaw('DATE(created_at) = DATE(?)', [booking.departure_time])
        .whereNotIn('status', ['delivered', 'cancelled']);

      if (activePackages.length === 0) {
        await db('schedules').where('id', booking.schedule_id).update({ status: 'dibatalkan' });
      }
    }
  }

  return deleted;
};

const deleteBooking = async (booking_id, user_id) => {
  const booking = await db('travel_bookings')
    .join('schedules', 'travel_bookings.schedule_id', 'schedules.id')
    .select('travel_bookings.booking_code', 'schedules.id as schedule_id', 'schedules.fleet_id', 'schedules.departure_time')
    .where('travel_bookings.id', booking_id)
    .where('travel_bookings.user_id', user_id)
    .first();

  if (!booking) return false;

  let updatedRows = 0;
  if (booking.booking_code) {
    updatedRows = await db('travel_bookings')
      .where({ booking_code: booking.booking_code, user_id })
      .whereIn('booking_status', ['dibatalkan', 'ditolak', 'REJECTED', 'selesai', 'COMPLETED'])
      .update({ is_hidden: true });
  } else {
    updatedRows = await db('travel_bookings')
      .where({ id: booking_id, user_id })
      .whereIn('booking_status', ['dibatalkan', 'ditolak', 'REJECTED', 'selesai', 'COMPLETED'])
      .update({ is_hidden: true });
  }

  if (updatedRows > 0 && booking) {
    // Auto-cleanup schedule jika tidak ada penumpang aktif lagi
    const activeBookings = await db('travel_bookings')
      .where('schedule_id', booking.schedule_id)
      .whereNotIn('booking_status', ['dibatalkan', 'ditolak', 'REJECTED']);

    if (activeBookings.length === 0) {
      const activePackages = await db('package_shipments')
        .where('fleet_id', booking.fleet_id || null)
        .where('departure_date', new Date(booking.departure_time).toISOString().split('T')[0])
        .whereNotIn('status', ['delivered', 'cancelled']);

      if (activePackages.length === 0) {
        await db('schedules').where('id', booking.schedule_id).del();
      }
    }
  }
  return updatedRows > 0;
};

// ==========================================================
// FUNGSI AUTO-MERGE: Memindahkan paket khusus ke mobil travel
// ==========================================================
const autoMergePackagesToRoute = async (routeScheduleId, departureDate) => {
  try {
    const routeSchedule = await db('schedules').where('id', routeScheduleId).first();
    if (!routeSchedule || !routeSchedule.fleet_id) return;

    // 1. Ambil semua jadwal Rute (Travel Reguler) di tanggal yang sama
    const activeRouteSchedules = await db('schedules')
      .whereNotNull('route_id')
      .whereRaw('DATE(departure_time) = ?', [departureDate]);
    const activeRouteFleetIds = activeRouteSchedules.map(s => s.fleet_id);

    // 2. Ambil semua paket di tanggal ini yang:
    // - statusnya aktif (belum selesai/dibatalkan)
    // - fleet_id-nya BUKAN mobil travel reguler mana pun (artinya ditugaskan ke mobil cadangan)
    const packagesToMerge = await db('package_shipments')
      .where('departure_date', departureDate)
      .whereNotIn('status', ['dibatalkan', 'ditolak', 'REJECTED', 'delivered'])
      .where(function() {
         if (activeRouteFleetIds.length > 0) {
           this.whereNotIn('fleet_id', activeRouteFleetIds).orWhereNull('fleet_id');
         } else {
           this.whereNotNull('id'); // ambil semua
         }
      });

    if (packagesToMerge.length === 0) return;

    // 3. Hitung total seat yang dibutuhkan
    let totalRequiredSeats = 0;
    packagesToMerge.forEach(p => {
      let reqSeat = 1;
      if (p.weight >= 60 || p.dimension === 'super_besar') reqSeat = 2;
      totalRequiredSeats += reqSeat;
    });

    // 4. Cek sisa kursi di mobil rute travel
    const loadInfo = await calculateLoad(routeSchedule.route_id, departureDate);
    
    // Jika kursi cukup, kita lakukan pemindahan
    if (loadInfo.sisa_kursi >= totalRequiredSeats) {
      
      // Pilih kursi dari belakang untuk paket-paket ini
      let availableSeats = [];
      for (let i = loadInfo.max_capacity; i >= 1; i--) {
        if (!loadInfo.occupied_seats_list.includes(i)) {
          availableSeats.push(i);
        }
      }

      let seatIndex = 0;
      
      // Pindahkan tiap paket
      for (const p of packagesToMerge) {
        let reqSeat = (p.weight >= 60 || p.dimension === 'super_besar') ? 2 : 1;
        let assignedSeats = [];
        for (let k = 0; k < reqSeat; k++) {
          if (seatIndex < availableSeats.length) {
            assignedSeats.push(availableSeats[seatIndex]);
            seatIndex++;
          }
        }
        
        await db('package_shipments')
          .where('id', p.id)
          .update({
            fleet_id: routeSchedule.fleet_id,
            seat_numbers: JSON.stringify(assignedSeats)
          });
      }

      // 5. Bersihkan jadwal khusus paket (route_id null) yang sekarang sudah kosong
      const packageOnlySchedules = await db('schedules')
        .whereNull('route_id')
        .whereNull('driver_id')
        .where('status', 'scheduled')
        .whereRaw('DATE(departure_time) = ?', [departureDate]);
        
      for (const sched of packageOnlySchedules) {
         const pkgs = await db('package_shipments')
            .where('fleet_id', sched.fleet_id)
            .where('departure_date', departureDate)
            .whereNotIn('status', ['dibatalkan', 'ditolak', 'REJECTED', 'delivered']);
         if (pkgs.length === 0) {
            await db('schedules').where('id', sched.id).del();
         }
      }
    }
  } catch (err) {
    console.error("Error auto merging packages:", err);
  }
};

module.exports = {
  calculateLoad,
  getSchedulesAvailability,
  getSeatsOccupancy,
  getSchedules,
  checkSeatAvailability,
  createBooking,
  getManifest,
  getTravelHistory,
  uploadPaymentProof,
  updatePaymentMethod,
  cancelBooking,
  deleteBooking,
  autoMergePackagesToRoute
};
