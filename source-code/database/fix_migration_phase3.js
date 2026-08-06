/**
 * fix_migration_phase3.js
 * Chạy từng ALTER TABLE riêng lẻ, bỏ qua lỗi "column already exists"
 * Dùng khi run_migration_phase3.js báo "2/7 thành công"
 */

require('dotenv').config({ path: '../backend/.env' });
const { Pool } = require('pg');

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  port:     parseInt(process.env.DB_PORT) || 5433,
  database: process.env.DB_DATABASE || 'personal_expense_manager',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '',
});

const steps = [
  // Expenses: notes
  `ALTER TABLE expenses ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL`,
  // Expenses: currency
  `ALTER TABLE expenses ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'VND'`,
  // Users: failed_attempts
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS failed_attempts INTEGER NOT NULL DEFAULT 0`,
  // Users: locked_until
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ DEFAULT NULL`,
  // Users: notify_budget_alert
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_budget_alert BOOLEAN NOT NULL DEFAULT TRUE`,
  // Users: notify_monthly_report
  `ALTER TABLE users ADD COLUMN IF NOT EXISTS notify_monthly_report BOOLEAN NOT NULL DEFAULT TRUE`,
  // Refresh tokens table
  `CREATE TABLE IF NOT EXISTS refresh_tokens (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      TEXT        NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked    BOOLEAN     NOT NULL DEFAULT FALSE
  )`,
  // Audit logs table
  `CREATE TABLE IF NOT EXISTS audit_logs (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER     REFERENCES users(id) ON DELETE SET NULL,
    event      VARCHAR(50) NOT NULL,
    ip_address INET        DEFAULT NULL,
    user_agent TEXT        DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  // Indexes
  `CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_logs_user    ON audit_logs(user_id)`,
  `CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_expenses_category  ON expenses(user_id, category)`,
  `CREATE INDEX IF NOT EXISTS idx_expenses_currency  ON expenses(currency)`,
];

async function run() {
  const client = await pool.connect();
  console.log('\n🚀 Chạy fix migration Phase 3...\n');

  let ok = 0, skip = 0, err = 0;

  for (const sql of steps) {
    const label = sql.trim().split('\n')[0].substring(0, 70);
    try {
      await client.query(sql);
      console.log(`✅ OK: ${label}`);
      ok++;
    } catch (e) {
      if (e.code === '42701') { // column already exists
        console.log(`⏭️  Bỏ qua (đã có): ${label}`);
        skip++;
      } else if (e.code === '42P07') { // table already exists
        console.log(`⏭️  Bỏ qua (đã có): ${label}`);
        skip++;
      } else if (e.code === '42P01') { // relation does not exist
        console.log(`❌ Lỗi (bảng không tồn tại): ${label}`);
        console.log(`   → ${e.message}`);
        err++;
      } else {
        console.log(`❌ Lỗi: ${label}`);
        console.log(`   → ${e.message}`);
        err++;
      }
    }
  }

  // Kiểm tra kết quả cuối
  console.log('\n📋 Kiểm tra cấu trúc bảng users:');
  const cols = await client.query(`
    SELECT column_name, data_type, column_default
    FROM information_schema.columns
    WHERE table_name = 'users'
    ORDER BY ordinal_position
  `);
  cols.rows.forEach(r => console.log(`   - ${r.column_name}: ${r.data_type}`));

  console.log('\n📋 Kiểm tra các bảng Phase 3:');
  const tables = await client.query(`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `);
  tables.rows.forEach(r => console.log(`   - ${r.tablename}`));

  console.log(`\n✨ Hoàn thành: ${ok} OK, ${skip} bỏ qua, ${err} lỗi\n`);

  client.release();
  await pool.end();

  if (err > 0) process.exit(1);
}

run().catch(e => {
  console.error('💥 Fatal:', e.message);
  process.exit(1);
});
