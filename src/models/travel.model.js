const db = require('../config/db');
const { isJabodetabek } = require('../utils/jabodetabek');
const { getAvailableFleets } = require('../helpers/fleetAvailability');

// --- DYNAMIC SEAT & FLEET LOGIC ---
const calculateLoad = async (route_id, dateString) => {
  // Cek apakah jadwal sudah ada
  const schedule = await db('schedules')
    .where('route_id', route_id)
    .whereRaw('DATE(departure_time) = ?', [dateString])
    .first();

  let used_seats = 0;
  let occupied_seats_list = [];

  if (schedule) {
    // 1. Hitung beban dari Travel Reguler
    const travelBookings = await db('travel_bookings')
      .where('schedule_id', schedule.id)
      .where(function() {
        this.where('booking_status', 'selesai')
            .orWhere('booking_status', 'menunggu_konfirmasi')
            .orWhere(function() {
              this.where('booking_status', 'menunggu_pembayaran')
                  .andWhere('locked_until', '>', db.fn.now());
            });
      });
      
    travelBookings.forEach(b => {
      used_seats += 1;
      occupied_seats_list.push(b.seat_number);
      if (b.baggage_weight >= 60 || b.baggage_dimension === 'super_besar') {
        used_seats += 1; // Memakan 2 kursi
        // Kita anggap kursi ekstra ini memakan kapasitas logic, tidak usah ditaruh di list seat_number visual dulu
      }
    });
  }

  // 2. Hitung beban dari Paket (Package Shipments)
  const packages = await db('package_shipments')
    .where('route_id', route_id)
    .whereRaw('DATE(created_at) = ?', [dateString])
    .whereNotIn('status', ['delivered', 'dibatalkan', 'ditolak']);
    
  packages.forEach(p => {
    used_seats += (p.seat_qty || 1);
    if (p.weight >= 60 || p.dimension === 'super_besar') {
      used_seats += 1;
    }
  });

  // 3. Evaluasi Unit secara dinamis dari armada yang TERSEDIA hari itu
  let unit = 'Tidak ada armada tersedia';
  let max_capacity = 0;

  try {
    // PENTING: kecualikan schedule.id ini dari daftar penguncian armada, 
    // karena armada ini justru sedang kita hitung kapasitasnya untuk jadwal ini!
    const availableFleets = await getAvailableFleets(
      null, 
      dateString, 
      dateString, 
      null, 
      schedule ? schedule.id : null
    );
    
    if (availableFleets.length > 0) {
      // Sort berdasarkan kapasitas terkecil ke terbesar
      availableFleets.sort((a, b) => a.seat_capacity - b.seat_capacity);
      
      // Cari armada terkecil yang bisa memuat used_seats
      const singleFleet = availableFleets.find(f => f.seat_capacity >= used_seats);
      
      if (singleFleet) {
        unit = singleFleet.car_type;
        max_capacity = singleFleet.seat_capacity;
      } else {
        // Jika kapasitas penumpang lebih besar dari armada terbesar yang ada
        const largestFleet = availableFleets[availableFleets.length - 1];
        const neededUnits = Math.ceil(used_seats / largestFleet.seat_capacity);
        unit = `${largestFleet.car_type} (${neededUnits} Unit)`;
        max_capacity = largestFleet.seat_capacity * neededUnits;
      }
    } else {
      // Fallback jika semua armada disewa/dipakai layanan lain
      unit = 'Armada Penuh/Disewa';
      max_capacity = 0;
    }
  } catch (err) {
    console.error("Error fetching fleets for unit evaluation:", err);
    // Fallback darurat jika query gagal
    unit = used_seats <= 14 ? 'Elf' : 'Elf (2 Unit)';
    max_capacity = used_seats <= 14 ? 14 : 28;
  }

  let status = used_seats >= max_capacity ? 'full' : 'available';

  return {
    status,
    sisa_kursi: Math.max(0, max_capacity - used_seats),
    unit,
    max_capacity,
    used_seats,
    occupied_seats_list,
    schedule_id: schedule ? schedule.id : null
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
    .where(function() {
      this.where('booking_status', 'selesai')
          .orWhere('booking_status', 'menunggu_konfirmasi')
          .orWhere(function() {
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
    .where(function() {
      this.where('booking_status', 'selesai')
          .orWhere('booking_status', 'menunggu_konfirmasi')
          .orWhere(function() {
            this.where('booking_status', 'menunggu_pembayaran')
                .andWhere('locked_until', '>', db.fn.now());
          });
    }).first();
  return !existingBooking;
};

const createBooking = async (data) => {
  // Modifikasi agar mendukung alokasi dinamis (membuat schedule jika belum ada)
  let schedule_id = data.schedule_id;
  
  if (!schedule_id && data.route_id && data.departure_date) {
    // Cek apakah schedule sudah ada di tanggal tersebut
    const existingSchedule = await db('schedules')
      .where('route_id', data.route_id)
      .whereRaw('DATE(departure_time) = ?', [data.departure_date])
      .first();
      
    if (existingSchedule) {
      schedule_id = existingSchedule.id;
    } else {
      // Bikin schedule baru on-the-fly, armada dialokasikan sistem
      const departureTime = new Date(data.departure_date);
      departureTime.setHours(8, 0, 0, 0); // Default jam 8 pagi
            // Gunakan getAvailableFleets dari fleetAvailability
        const availableFleets = await getAvailableFleets(null, data.departure_date, data.departure_date);
        
        if (availableFleets.length === 0) {
          const error = new Error('Tidak ada armada yang tersedia pada tanggal tersebut.');
          error.code = 'NO_FLEET_AVAILABLE';
          throw error;
        }

        const selectedFleet = availableFleets[0]; // Ambil armada pertama yang tersedia
        
        const [newSchedule] = await db('schedules').insert({
          route_id: data.route_id,
          fleet_id: selectedFleet.id,
          departure_time: departureTime,
          status: 'scheduled'
        }).returning('*');
        schedule_id = newSchedule.id;
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

  let originalPrice = parseFloat(schedule.base_price);
  if (isNaN(originalPrice)) originalPrice = 250000;
  
  let finalPrice = originalPrice;
  let appliedPromoId = data.promo_id || null;
  let promoObj = null;
  
  try {
    let promoQuery = db('promotions').where('is_active', true);
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
  if (data.baggage_weight >= 60.00 || data.baggage_dimension === 'super_besar') {
    isBaggageCharge = true;
    finalPrice += 250000.00; // Harga default charge, idealnya ini ambil dari config
    originalPrice += 250000.00; // Tambahkan juga ke harga asli
  }

  let finalBookingStatus = 'menunggu_konfirmasi';
  let isJab = false;
  if (data.tujuan_kecamatan && isJabodetabek(data.tujuan_kecamatan)) {
    isJab = true;
    finalBookingStatus = 'menunggu_pembayaran';
    originalPrice = 250000;
    
    finalPrice = 250000;
    if (isBaggageCharge) {
        finalPrice += 250000;
        originalPrice += 250000;
    }
    
    if (appliedPromoId && promoObj) {
      // Re-apply discount if there was a promo
      const discount = finalPrice * (parseFloat(promoObj.discount_percentage) / 100);
      finalPrice = finalPrice - discount;
    }
  }

  const [booking] = await db('travel_bookings').insert({
    user_id: data.user_id,
    schedule_id: schedule_id,
    seat_number: data.seat_number,
    pickup_address: data.pickup_address,
    dropoff_address: data.dropoff_address,
    payment_method: data.payment_method || null,
    baggage_description: data.baggage_description || null,
    baggage_weight: data.baggage_weight || null,
    baggage_dimension: data.baggage_dimension || null,
    is_baggage_charge: isBaggageCharge,
    booking_status: finalBookingStatus, // Sesuai dengan alur locked 10 menit jika jabodetabek, else konfirmasi
    locked_until: db.raw("NOW() + INTERVAL '10 minutes'"),
    price: finalPrice,
    original_price: originalPrice,
    promo_id: appliedPromoId
  }).returning('*');
  
  return booking;
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
    .where('travel_bookings.booking_status', 'selesai')
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
      'routes.origin', 'routes.destination', 'schedules.departure_time',
      'schedules.status as schedule_status'
    )
    .where('travel_bookings.user_id', user_id)
    .orderBy('travel_bookings.created_at', 'desc');
};

const uploadPaymentProof = async (booking_id, user_id, file_url) => {
  const [updated] = await db('travel_bookings')
    .where({ id: booking_id, user_id })
    .whereIn('booking_status', ['menunggu_pembayaran', 'menunggu_konfirmasi']) 
    .update({
      payment_proof_url: file_url,
      payment_method: 'cashless',
      booking_status: 'menunggu_konfirmasi'
    })
    .returning('*');
  return updated;
};

const updatePaymentMethod = async (booking_id, user_id, payment_method) => {
  const updateData = { payment_method };
  // Jika memilih cash, status langsung diset ke selesai (siap dijemput)
  if (payment_method === 'cash') {
    updateData.booking_status = 'selesai';
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
    .select('travel_bookings.booking_status', 'schedules.departure_time')
    .where('travel_bookings.id', booking_id)
    .andWhere('travel_bookings.user_id', user_id)
    .first();

  if (!booking) return null;

  if (['dibatalkan', 'ditolak', 'REJECTED'].includes(booking.booking_status)) {
    const error = new Error('Pesanan ini sudah dibatalkan sebelumnya.');
    error.code = 'ALREADY_CANCELLED';
    throw error;
  }

  if (!['selesai', 'COMPLETED', 'APPROVED', 'menunggu_pembayaran', 'menunggu_konfirmasi'].includes(booking.booking_status)) {
    const error = new Error(`Pesanan dengan status ${booking.booking_status} tidak dapat dibatalkan oleh pelanggan.`);
    error.code = 'INVALID_STATUS';
    throw error;
  }

  if (['selesai', 'COMPLETED', 'APPROVED'].includes(booking.booking_status)) {
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

  const [updated] = await db('travel_bookings')
    .where({ id: booking_id, user_id })
    .update({ booking_status: 'dibatalkan' })
    .returning('*');
    
  if (updated) {
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
        await db('schedules').where('id', booking.schedule_id).del();
      }
    }
  }
    
  return updated;
};

const deleteBooking = async (booking_id, user_id) => {
  const booking = await db('travel_bookings')
    .join('schedules', 'travel_bookings.schedule_id', 'schedules.id')
    .select('schedules.id as schedule_id', 'schedules.fleet_id', 'schedules.departure_time')
    .where('travel_bookings.id', booking_id)
    .where('travel_bookings.user_id', user_id)
    .first();

  // Hanya bisa dihapus jika statusnya dibatalkan atau ditolak
  const deletedRows = await db('travel_bookings')
    .where({ id: booking_id, user_id })
    .whereIn('booking_status', ['dibatalkan', 'ditolak', 'REJECTED'])
    .del();
    
  if (deletedRows > 0 && booking) {
    // Auto-cleanup schedule jika tidak ada penumpang aktif lagi
    const activeBookings = await db('travel_bookings')
      .where('schedule_id', booking.schedule_id)
      .whereNotIn('booking_status', ['dibatalkan', 'ditolak', 'REJECTED']);
      
    if (activeBookings.length === 0) {
      const activePackages = await db('package_shipments')
        .where('fleet_id', booking.fleet_id || null)
        .whereRaw('DATE(created_at) = DATE(?)', [booking.departure_time])
        .whereNotIn('status', ['delivered', 'cancelled']);
        
      if (activePackages.length === 0) {
        await db('schedules').where('id', booking.schedule_id).del();
      }
    }
  }
  return deletedRows > 0;
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
  deleteBooking
};
