require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_DATABASE,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function run() {
  const client = await pool.connect();
  try {
    console.log('Creating goals table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS goals (
        id             SERIAL PRIMARY KEY,
        user_id        INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title          VARCHAR(200)  NOT NULL,
        category       VARCHAR(100)  DEFAULT NULL,
        target_amount  NUMERIC(15,2) NOT NULL CHECK (target_amount > 0),
        current_amount NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
        deadline       DATE          DEFAULT NULL,
        status         VARCHAR(20)   NOT NULL DEFAULT 'active',
        created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      )
    `);
    console.log('goals table OK');

    await client.query(`CREATE INDEX IF NOT EXISTS idx_goals_user     ON goals(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_goals_status   ON goals(user_id, status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_goals_deadline ON goals(deadline NULLS LAST)`);
    console.log('goals indexes OK');

    console.log('Creating reminders table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS reminders (
        id         SERIAL PRIMARY KEY,
        user_id    INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title      VARCHAR(200)  NOT NULL,
        amount     NUMERIC(15,2) DEFAULT NULL,
        category   VARCHAR(100)  DEFAULT NULL,
        due_date   DATE          NOT NULL,
        frequency  VARCHAR(20)   NOT NULL DEFAULT 'once',
        active     BOOLEAN       NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      )
    `);
    console.log('reminders table OK');

    await client.query(`CREATE INDEX IF NOT EXISTS idx_reminders_user     ON reminders(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_reminders_due_date ON reminders(due_date ASC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_reminders_active   ON reminders(user_id, active)`);
    console.log('reminders indexes OK');

    // Verify
    const res = await client.query(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public' AND tablename IN ('goals','reminders')
      ORDER BY tablename
    `);
    console.log('\n=== Tables da tao ===');
    res.rows.forEach(r => console.log('  OK:', r.tablename));
    console.log('\nMigration Phase 4 hoan thanh!');
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    client.release();
    pool.end();
  }
}

run();
