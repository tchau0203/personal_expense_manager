const request = require('supertest');
const app     = require('../server');

jest.mock('../../database/database', () => {
  const mockQuery = jest.fn();
  return {
    getPool: () => ({ query: mockQuery }),
    __mockQuery: mockQuery,
  };
});

jest.mock('bcryptjs', () => ({
  hash:    jest.fn().mockResolvedValue('$2b$10$hashed'),
  compare: jest.fn(),
}));

const { __mockQuery } = require('../../database/database');
const bcrypt = require('bcryptjs');
process.env.JWT_SECRET = 'test_secret';

describe('POST /api/auth/register', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 400 if fields are missing', async () => {
    const res = await request(app).post('/api/auth/register').send({ username: 'user' });
    expect(res.status).toBe(400);
  });

  it('should return 400 if password is too short', async () => {
    const res = await request(app).post('/api/auth/register')
      .send({ username: 'u', email: 'u@a.com', password: '123' });
    expect(res.status).toBe(400);
  });

  it('should return 409 if user already exists', async () => {
    __mockQuery.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // exists check
    const res = await request(app).post('/api/auth/register')
      .send({ username: 'existing', email: 'e@a.com', password: 'password123' });
    expect(res.status).toBe(409);
  });

  it('should register successfully', async () => {
    __mockQuery
      .mockResolvedValueOnce({ rows: [] })         // no existing user
      .mockResolvedValueOnce({ rows: [{ id: 1, username: 'newuser', email: 'new@a.com' }] }) // INSERT user
      .mockResolvedValueOnce({ rows: [] });          // audit log INSERT

    const res = await request(app).post('/api/auth/register')
      .send({ username: 'newuser', email: 'new@a.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.username).toBe('newuser');
  });
});

describe('POST /api/auth/login', () => {
  beforeEach(() => jest.clearAllMocks());

  it('should return 400 if fields are missing', async () => {
    const res = await request(app).post('/api/auth/login').send({ username: 'user' });
    expect(res.status).toBe(400);
  });

  it('should return 401 for non-existent user', async () => {
    __mockQuery.mockResolvedValueOnce({ rows: [] });
    const res = await request(app).post('/api/auth/login')
      .send({ username: 'nobody', password: '123456' });
    expect(res.status).toBe(401);
  });

  it('should return 401 for wrong password', async () => {
    __mockQuery
      .mockResolvedValueOnce({                                        // SELECT user
        rows: [{ id: 1, username: 'user', email: 'u@a.com', password_hash: '$2b$10$hash',
                 failed_attempts: 0, locked_until: null }]
      })
      .mockResolvedValueOnce({ rows: [] })  // UPDATE failed_attempts
      .mockResolvedValueOnce({ rows: [] }); // audit log INSERT
    bcrypt.compare.mockResolvedValueOnce(false);

    const res = await request(app).post('/api/auth/login')
      .send({ username: 'user', password: 'wrongpass' });
    expect(res.status).toBe(401);
  });

  it('should login successfully', async () => {
    __mockQuery
      .mockResolvedValueOnce({                                          // SELECT user
        rows: [{ id: 1, username: 'user', email: 'u@a.com', password_hash: '$2b$10$hash',
                 failed_attempts: 0, locked_until: null }]
      })
      .mockResolvedValueOnce({ rows: [] })  // UPDATE reset failed_attempts
      .mockResolvedValueOnce({ rows: [] })  // audit log INSERT
      .mockResolvedValueOnce({ rows: [] }); // INSERT refresh_token

    bcrypt.compare.mockResolvedValueOnce(true);

    const res = await request(app).post('/api/auth/login')
      .send({ username: 'user', password: 'correctpass' });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.username).toBe('user');
  });
});

describe('POST /api/auth/logout', () => {
  it('should logout successfully (stateless)', async () => {
    const res = await request(app).post('/api/auth/logout');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
