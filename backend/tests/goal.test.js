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

// ── GET /api/goals ───────────────────────────────────────────────
describe('GET /api/goals', () => {
  it('should return 401 without token', async () => {
    const res = await request(app).get('/api/goals');
    expect(res.status).toBe(401);
  });

  it('should return goals list with valid token', async () => {
    __mockQuery.mockResolvedValueOnce({
      rows: [
        { id: 1, user_id: 1, title: 'Mua xe', target_amount: '10000000', current_amount: '2000000', deadline: '2026-12-31', status: 'active' },
      ],
    });

    const res = await request(app)
      .get('/api/goals')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].title).toBe('Mua xe');
  });
});

// ── POST /api/goals ──────────────────────────────────────────────
describe('POST /api/goals', () => {
  it('should return 401 without token', async () => {
    const res = await request(app).post('/api/goals').send({});
    expect(res.status).toBe(401);
  });

  it('should return 400 with missing title', async () => {
    const res = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${token}`)
      .send({ target_amount: 5000000 });
    expect(res.status).toBe(400);
  });

  it('should return 400 with invalid target_amount (≤0)', async () => {
    const res = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Tiết kiệm', target_amount: -100 });
    expect(res.status).toBe(400);
  });

  it('should create goal with valid data', async () => {
    __mockQuery.mockResolvedValueOnce({
      rows: [{ id: 2, user_id: 1, title: 'Du lịch Nhật', target_amount: '15000000', current_amount: '0', deadline: null, status: 'active' }],
    });

    const res = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Du lịch Nhật', target_amount: 15000000 });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Du lịch Nhật');
  });
});

// ── PUT /api/goals/:id ───────────────────────────────────────────
describe('PUT /api/goals/:id', () => {
  it('should return 401 without token', async () => {
    const res = await request(app).put('/api/goals/1').send({});
    expect(res.status).toBe(401);
  });

  it('should return 400 with invalid fields', async () => {
    const res = await request(app)
      .put('/api/goals/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '' });
    expect(res.status).toBe(400);
  });

  it('should update goal with valid data', async () => {
    __mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, title: 'Mua xe máy', target_amount: '12000000', current_amount: '3000000', status: 'active' }],
    });

    const res = await request(app)
      .put('/api/goals/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Mua xe máy', target_amount: 12000000, current_amount: 3000000 });

    expect(res.status).toBe(200);
    expect(res.body.title).toBe('Mua xe máy');
  });

  it('should return 404 for non-existent goal', async () => {
    __mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .put('/api/goals/999')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Non-existent', target_amount: 1000000 });

    expect(res.status).toBe(404);
  });
});

// ── DELETE /api/goals/:id ────────────────────────────────────────
describe('DELETE /api/goals/:id', () => {
  it('should return 401 without token', async () => {
    const res = await request(app).delete('/api/goals/1');
    expect(res.status).toBe(401);
  });

  it('should delete goal', async () => {
    __mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

    const res = await request(app)
      .delete('/api/goals/1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should return 404 for non-existent goal', async () => {
    __mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .delete('/api/goals/999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
