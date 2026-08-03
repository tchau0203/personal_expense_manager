const request = require('supertest');
const app     = require('../server');

// Mock getPool to avoid real DB in tests
jest.mock('../../database/database', () => {
  const mockQuery = jest.fn();
  return {
    getPool: () => ({ query: mockQuery }),
    __mockQuery: mockQuery,
  };
});

const { __mockQuery } = require('../../database/database');

// Mock JWT
process.env.JWT_SECRET = 'test_secret';

let token;
beforeAll(async () => {
  const jwt = require('jsonwebtoken');
  token = jwt.sign({ id: 1, username: 'testuser' }, 'test_secret', { expiresIn: '1h' });
});

describe('GET /api/expenses', () => {
  it('should return 401 without token', async () => {
    const res = await request(app).get('/api/expenses');
    expect(res.status).toBe(401);
  });

  it('should return expenses with valid token', async () => {
    __mockQuery
      .mockResolvedValueOnce({ rows: [{ count: '2' }] })
      .mockResolvedValueOnce({
        rows: [
          { id: 1, description: 'Cà phê', amount: '30000', category: 'Ăn uống', expense_date: '2026-08-01', is_recurring: false },
          { id: 2, description: 'Xăng', amount: '50000', category: 'Đi lại', expense_date: '2026-08-02', is_recurring: false },
        ]
      });

    const res = await request(app)
      .get('/api/expenses')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.total).toBe(2);
  });
});

describe('POST /api/expenses', () => {
  it('should return 401 without token', async () => {
    const res = await request(app).post('/api/expenses').send({});
    expect(res.status).toBe(401);
  });

  it('should return 400 with missing fields', async () => {
    const res = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'test' }); // missing amount, category, date
    expect(res.status).toBe(400);
  });

  it('should return 400 with negative amount', async () => {
    const res = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'test', amount: -100, category: 'Khác', date: '2026-08-01' });
    expect(res.status).toBe(400);
  });

  it('should create expense with valid data', async () => {
    __mockQuery.mockResolvedValueOnce({
      rows: [{ id: 3, description: 'Ăn phở', amount: '70000', category: 'Ăn uống', expense_date: '2026-08-03', is_recurring: false }]
    });

    const res = await request(app)
      .post('/api/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Ăn phở', amount: 70000, category: 'Ăn uống', date: '2026-08-03' });

    expect(res.status).toBe(201);
    expect(res.body.description).toBe('Ăn phở');
  });
});

describe('PUT /api/expenses/:id', () => {
  it('should return 401 without token', async () => {
    const res = await request(app).put('/api/expenses/1').send({});
    expect(res.status).toBe(401);
  });

  it('should return 400 with missing fields', async () => {
    const res = await request(app)
      .put('/api/expenses/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'test' });
    expect(res.status).toBe(400);
  });

  it('should update expense with valid data', async () => {
    __mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, description: 'Cà phê sữa', amount: '35000', category: 'Ăn uống', expense_date: '2026-08-01' }]
    });

    const res = await request(app)
      .put('/api/expenses/1')
      .set('Authorization', `Bearer ${token}`)
      .send({ description: 'Cà phê sữa', amount: 35000, category: 'Ăn uống', date: '2026-08-01' });

    expect(res.status).toBe(200);
    expect(res.body.description).toBe('Cà phê sữa');
  });
});

describe('DELETE /api/expenses/:id', () => {
  it('should return 401 without token', async () => {
    const res = await request(app).delete('/api/expenses/1');
    expect(res.status).toBe(401);
  });

  it('should delete expense', async () => {
    __mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

    const res = await request(app)
      .delete('/api/expenses/1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should return 404 for non-existent expense', async () => {
    __mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .delete('/api/expenses/999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
