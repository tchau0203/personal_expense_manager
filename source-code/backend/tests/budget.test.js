const request = require('supertest');
const app     = require('../server');

jest.mock('../../database/database', () => {
  const mockQuery = jest.fn();
  return {
    getPool: () => ({ query: mockQuery }),
    __mockQuery: mockQuery,
  };
});

const { __mockQuery } = require('../../database/database');
process.env.JWT_SECRET = 'test_secret';

let token;
beforeAll(() => {
  const jwt = require('jsonwebtoken');
  token = jwt.sign({ id: 1, username: 'testuser' }, 'test_secret', { expiresIn: '1h' });
});

describe('GET /api/budgets', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 401 without token', async () => {
    const res = await request(app).get('/api/budgets');
    expect(res.status).toBe(401);
  });

  it('should return budgets with spent amounts', async () => {
    __mockQuery
      .mockResolvedValueOnce({ rows: [
        { id: 1, user_id: 1, category: 'Ăn uống', amount: '2000000', month: 8, year: 2026 }
      ]})
      .mockResolvedValueOnce({ rows: [
        { category: 'Ăn uống', spent: '500000' }
      ]});

    const res = await request(app)
      .get('/api/budgets?month=8&year=2026')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body[0].spent).toBe(500000);
    expect(res.body[0].category).toBe('Ăn uống');
  });
});

describe('POST /api/budgets', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 400 with missing fields', async () => {
    const res = await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({ category: 'Ăn uống' }); // missing amount, month, year
    expect(res.status).toBe(400);
  });

  it('should create budget', async () => {
    __mockQuery.mockResolvedValueOnce({
      rows: [{ id: 1, user_id: 1, category: 'Ăn uống', amount: '2000000', month: 8, year: 2026 }]
    });

    const res = await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({ category: 'Ăn uống', amount: 2000000, month: 8, year: 2026 });

    expect(res.status).toBe(201);
    expect(res.body.category).toBe('Ăn uống');
  });
});

describe('DELETE /api/budgets/:id', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should delete budget', async () => {
    __mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] });

    const res = await request(app)
      .delete('/api/budgets/1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should return 404 for non-existent budget', async () => {
    __mockQuery.mockResolvedValueOnce({ rows: [] });

    const res = await request(app)
      .delete('/api/budgets/999')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });
});
