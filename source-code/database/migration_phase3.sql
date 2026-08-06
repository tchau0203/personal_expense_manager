-- ============================================================
-- Phase 3 Migration — Personal Expense Manager
-- Safe to run on existing database (uses IF NOT EXISTS)
-- Run via: node run_migration_phase3.js
-- ============================================================

-- 1. Add notes column to expenses
ALTER TABLE expenses
    ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT NULL;

-- 2. Add currency column to expenses
ALTER TABLE expenses
    ADD COLUMN IF NOT EXISTS currency VARCHAR(3) NOT NULL DEFAULT 'VND';

-- 3. Add account lockout fields to users
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS failed_attempts INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ DEFAULT NULL;

-- 4. Add email_notifications preference to users
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS notify_budget_alert   BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS notify_monthly_report BOOLEAN NOT NULL DEFAULT TRUE;

-- 5. Create refresh_tokens table
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token      TEXT        NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    revoked    BOOLEAN     NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token ON refresh_tokens(token);

-- 6. Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER     REFERENCES users(id) ON DELETE SET NULL,
    event      VARCHAR(50) NOT NULL,  -- 'login_success', 'login_fail', 'logout', 'password_change'
    ip_address INET        DEFAULT NULL,
    user_agent TEXT        DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user    ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- 7. Additional performance indexes
CREATE INDEX IF NOT EXISTS idx_expenses_category  ON expenses(user_id, category);
CREATE INDEX IF NOT EXISTS idx_expenses_currency  ON expenses(currency);

-- Done
SELECT 'Phase 3 migration completed successfully' AS status;
