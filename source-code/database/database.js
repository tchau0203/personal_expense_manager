const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const { Pool } = require('pg');

let _pool = null;

function getPool() {
  if (!_pool) {
    _pool = new Pool({
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT) || 5433,
      database: process.env.DB_DATABASE || 'personal_expense_manager',
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD,
    });

    _pool.on('connect', () => {
      if (process.env.NODE_ENV !== 'test') {
        console.log('Đã kết nối PostgreSQL thành công');
      }
    });

    _pool.on('error', (err) => {
      console.error('PostgreSQL pool error:', err.message);
    });
  }
  return _pool;
}

// Legacy support: poolPromise vẫn hoạt động với code cũ
const poolPromise = Promise.resolve(getPool());

module.exports = { getPool, poolPromise };