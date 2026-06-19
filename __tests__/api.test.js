const request = require('supertest');
const app = require('../src/app');

// ============================================================
// TEST SUITE: AUTH ENDPOINTS
// ============================================================

describe('Auth Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('harus menolak jika data tidak lengkap (validasi Zod)', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Ab', email: 'bukan-email' }); // Data tidak valid

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.message).toBe('Validasi gagal');
      expect(res.body.errors).toBeDefined();
      expect(Array.isArray(res.body.errors)).toBe(true);
    });

    it('harus menolak jika password terlalu pendek', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: 'test@example.com',
          password: '123',
          phone_number: '081234567890'
        });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.errors).toContain('Password minimal 6 karakter');
    });
  });

  describe('POST /api/auth/login', () => {
    it('harus menolak jika email kosong', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: '', password: 'password123' });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
    });

    it('harus menolak jika password kosong', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: '' });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
    });
  });
});

// ============================================================
// TEST SUITE: PUBLIC ENDPOINTS
// ============================================================

describe('Public Endpoints', () => {
  describe('GET /', () => {
    it('harus mengembalikan pesan selamat datang API', async () => {
      const res = await request(app).get('/');

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.message).toContain('Welcome');
      expect(res.body.version).toBeDefined();
    });
  });

  describe('GET /api/travel/schedules', () => {
    it('harus mengembalikan status 200 dengan format response yang benar', async () => {
      const res = await request(app).get('/api/travel/schedules');

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.data).toBeDefined();
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/content/banners', () => {
    it('harus mengembalikan banner aktif', async () => {
      const res = await request(app).get('/api/content/banners');

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/content/destinations', () => {
    it('harus mengembalikan data destinasi', async () => {
      const res = await request(app).get('/api/content/destinations');

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  describe('GET /api/content/promotions', () => {
    it('harus mengembalikan data promosi aktif', async () => {
      const res = await request(app).get('/api/content/promotions');

      expect(res.statusCode).toBe(200);
      expect(res.body.status).toBe('success');
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });
});

// ============================================================
// TEST SUITE: PROTECTED ENDPOINTS (Tanpa Token)
// ============================================================

describe('Protected Endpoints (Tanpa Token)', () => {
  it('POST /api/travel/bookings harus ditolak tanpa token', async () => {
    const res = await request(app)
      .post('/api/travel/bookings')
      .send({});

    expect(res.statusCode).toBe(401);
    expect(res.body.status).toBe('error');
    expect(res.body.message).toContain('Token');
  });

  it('GET /api/travel/history harus ditolak tanpa token', async () => {
    const res = await request(app).get('/api/travel/history');

    expect(res.statusCode).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('GET /api/admin/dashboard/metrics harus ditolak tanpa token', async () => {
    const res = await request(app).get('/api/admin/dashboard/metrics');

    expect(res.statusCode).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('GET /api/admin/master/fleets harus ditolak tanpa token', async () => {
    const res = await request(app).get('/api/admin/master/fleets');

    expect(res.statusCode).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('GET /api/driver/schedules harus ditolak tanpa token', async () => {
    const res = await request(app).get('/api/driver/schedules');

    expect(res.statusCode).toBe(401);
    expect(res.body.status).toBe('error');
  });

  it('GET /api/admin/cashflow/summary harus ditolak tanpa token', async () => {
    const res = await request(app).get('/api/admin/cashflow/summary');

    expect(res.statusCode).toBe(401);
    expect(res.body.status).toBe('error');
  });
});

// ============================================================
// TEST SUITE: VALIDASI INPUT
// ============================================================

describe('Validasi Input', () => {
  describe('POST /api/auth/forgot-password', () => {
    it('harus menolak jika format email tidak valid', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'bukan-format-email' });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
      expect(res.body.errors).toContain('Format email tidak valid');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('harus menolak jika token dan password kosong', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: '', newPassword: '' });

      expect(res.statusCode).toBe(400);
      expect(res.body.status).toBe('error');
    });
  });
});
