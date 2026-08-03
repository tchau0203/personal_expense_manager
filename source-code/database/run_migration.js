const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../backend/.env') });
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5433,
  database: process.env.DB_DATABASE || 'personal_expense_manager',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
});

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'migration_node.sql'), 'utf8');
  const statements = sql.split(';').map(s => s.trim()).filter(s => s.length > 0);

  for (const stmt of statements) {
    try {
      await pool.query(stmt);
      console.log('OK:', stmt.substring(0, 60).replace(/\n/g, ' ') + '...');
    } catch (err) {
      console.error('ERR:', err.message, '\nSQL:', stmt.substring(0, 80));
    }
  }
  await pool.end();
  console.log('\n✅ Migration hoàn tất!');
}

migrate();
