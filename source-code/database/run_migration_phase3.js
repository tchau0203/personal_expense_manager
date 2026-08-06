// run_migration_phase3.js — Chạy Phase 3 migration qua pg Pool
const { getPool } = require('./database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  const pool = getPool();
  const sql = fs.readFileSync(path.join(__dirname, 'migration_phase3.sql'), 'utf8');

  // Tách từng statement bằng dấu ;
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`🚀 Chạy Phase 3 migration với ${statements.length} statements...`);
  let successCount = 0;

  for (const stmt of statements) {
    try {
      const result = await pool.query(stmt);
      if (result.rows && result.rows.length > 0 && result.rows[0].status) {
        console.log('✅', result.rows[0].status);
      }
      successCount++;
    } catch (err) {
      if (err.message.includes('already exists') || err.message.includes('does not exist')) {
        console.log(`⚠️  Bỏ qua (đã tồn tại): ${stmt.substring(0, 60)}...`);
      } else {
        console.error(`❌ Lỗi: ${err.message}`);
        console.error(`   Statement: ${stmt.substring(0, 100)}`);
      }
    }
  }

  console.log(`\n✅ Hoàn thành: ${successCount}/${statements.length} statements thành công.`);
  process.exit(0);
}

runMigration().catch(err => {
  console.error('❌ Migration thất bại:', err.message);
  process.exit(1);
});
