const request = require('supertest');
const app     = require('../server');

// Mock getPool to avoid real DB in tests
jest.mock('../database/database', () => {
  const mockQuery = jest.fn();
  return {
    getPool: () => ({ query: mockQuery }),
    __mockQuery: mockQuery,
  };
});

const { __mockQuery } = require('../database/database');

process.env.JWT_SECRET = 'test_secret';

let token;
beforeAll(async () => {
  const jwt = require('jsonwebtoken');
  token = jwt.sign({ id: 1, username: 'testuser' }, 'test_secret', { expiresIn: '1h' });
});

beforeEach(() => {
  __mockQuery.mockReset();
});

// ── GET /api/reminders ───────────────────────────────────────────
describe('GET /api/reminders', () => {
  it('should return 401 without token', async () => {
    const res = await request(app).get('/api/reminders');
    expect(res.status).toBe(401);
  });

  it('should return reminders list with valid token', async () => {
    __mockQuery.mockResolvedValueOnce({
      rows: [
        { id: 1, user_id: 1, title: 'Tiền nhà', amount: '3000000', category: 'Tiền nhà', due_date: '2026-08-15', frequency: 'monthly', active: true },
      ],
    });

    const res = await request(app)
      .get('/api/reminders')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].title).toBe('Tiền nhà');
  });
});

// ── POST /api/reminders ──────────────────────────────────────────
describe('POST /api/reminders', () => {
  it('should return 401 without token', async () => {
    const res = await request(app).post('/api/reminders').send({});
    expect(res.status).toBe(401);
  });

  it('should return 400 with missing title', async () => {
    const res = await request(app)
      .post('/api/reminders')
      .set('Authorization', `Bearer ${token}`)
      .send({ due_date: '2026-08-15' });
    expect(res.status).toBe(400);
  });

  it('should return 400 with missing due_date', async () => {
    const res = await request(app)
      .post('/api/reminders')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Tiền điện' });
    expect(res.status).toBe(400);
  });

  it('should return 400 with invalid frequency', async () => {
    const res = await request(app)
      .post('/api/reminders')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Tiền điện', due_date: '2026-08-15', frequency: 'invalid' });
    expect(res.status).toBe(400);
  });

  it('should create reminder with valid data', async () => {
    __mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, user_id: 1, title: 'Tiền điện', amount: '500000', due_date: '2026-08-15', frequency: 'monthly', active: true }],
    });

    const res = await request(app)
      .post('/api/reminders')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Tiền điện', amount: 500000, due_date: '2026-08-15', frequency: 'monthly' });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Tiền điện');
  });
});

// ── PUT /api/reminders/:id ───────────────────────────────────────
describe('PUT /api/reminders/:id', () => {
  it('should return 401 without token', async () => {
    const res = await request(app).put('/api/reminders/1').send({});
    expect(res.status).toBe(401);
  });

  it('should return 400 with missing fields', async () => {
    const res = await request(app)
      .put('/api/reminders/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Tiền nhà' }); // missing due_date
    expect(res.status).toBe(400);
  });

  it('should update reminder with valid data', async () => {
    __mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, title: 'Tiền nhà tháng 9', due_date: '2026-09-01', frequency: 'monthly', active: true }],
    });

    const res = await request(app)
      .put('/api/reminders/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Tiền nhà tháng 9', due_date: '2026-09-01', frequency: 'monthly' });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Tiền nhà tháng 9');
  });

  it('should return 404 for non-existent reminder', async () => {
    __mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .put('/api/reminders/999')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Non-existent', due_date: '2026-09-01', frequency: 'once' });

    expect(res.status).toBe(404);
  });
});

// ── DELETE /api/reminders/:id ────────────────────────────────────
describe('DELETE /api/reminders/:id', () => {
  it('should return 401 without token', async () => {
    const res = await request(app).delete('/api/reminders/1');
    expect(res.status).toBe(401);
  });

  it('should delete reminder', async () => {
    __mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

    const res = await request(app)
      .delete('/api/reminders/1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should return 404 for non-existent reminder', async () => {
    __mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .delete('/api/reminders/999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
