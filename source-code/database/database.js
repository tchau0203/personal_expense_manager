const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const { Pool } = require('pg');

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5433,
  database: process.env.DB_DATABASE || 'personal_expense_manager'
};

if (process.env.DB_USER && process.env.DB_PASSWORD) {
  config.user = process.env.DB_USER;
  config.password = process.env.DB_PASSWORD;
} else {
  config.user = process.env.USERNAME || 'postgres';
}

const poolPromise = new Pool(config)
  .connect()
  .then(client => {
    console.log('Đã kết nối PostgreSQL thành công');
    client.release();
    return new Pool(config);
  })
  .catch(err => {
    console.log('Lỗi kết nối DB: ', err);
    return null;
  });

module.exports = { poolPromise };