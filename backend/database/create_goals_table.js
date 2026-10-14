const { getPool } = require('../database/database');

(async () => {
  const pool = getPool();
  try {
    const sql = `
      CREATE TABLE IF NOT EXISTS goals (
        id             SERIAL PRIMARY KEY,
        user_id        INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title          TEXT          NOT NULL,
        category       TEXT          DEFAULT NULL,
        target_amount  NUMERIC(15,2) NOT NULL,
        current_amount NUMERIC(15,2) NOT NULL DEFAULT 0,
        deadline       DATE          DEFAULT NULL,
        created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
        updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
      )
    `;
    await pool.query(sql);
    console.log('OK: Bang goals da duoc tao thanh cong!');

    await pool.query('CREATE INDEX IF NOT EXISTS idx_goals_user_id ON goals(user_id)');
    console.log('OK: Index da duoc tao!');

    const r = await pool.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'goals' ORDER BY ordinal_position"
    );
    console.log('Cau truc bang goals:');
    r.rows.forEach(row => console.log(' -', row.column_name, ':', row.data_type));
  } catch (err) {
    console.error('LOI:', err.message);
  }
  process.exit(0);
})();
