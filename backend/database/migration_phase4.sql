-- ============================================================
-- Phase 4 Migration — Personal Expense Manager
-- Safe to run on existing database (uses IF NOT EXISTS)
-- Run via: node run_migration_phase4.js
-- ============================================================

-- 1. Create goals table
CREATE TABLE IF NOT EXISTS goals (
    id             SERIAL PRIMARY KEY,
    user_id        INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title          VARCHAR(200) NOT NULL,
    category       VARCHAR(100) DEFAULT NULL,
    target_amount  NUMERIC(15,2) NOT NULL CHECK (target_amount > 0),
    current_amount NUMERIC(15,2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
    deadline       DATE         DEFAULT NULL,
    status         VARCHAR(20)  NOT NULL DEFAULT 'active',  -- active | completed | archived
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goals_user       ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_status     ON goals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_goals_deadline   ON goals(deadline NULLS LAST);

-- 2. Create reminders table
CREATE TABLE IF NOT EXISTS reminders (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      VARCHAR(200) NOT NULL,
    amount     NUMERIC(15,2) DEFAULT NULL,
    category   VARCHAR(100) DEFAULT NULL,
    due_date   DATE         NOT NULL,
    frequency  VARCHAR(20)  NOT NULL DEFAULT 'once',  -- once | weekly | monthly
    active     BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reminders_user     ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_due_date ON reminders(due_date ASC);
CREATE INDEX IF NOT EXISTS idx_reminders_active   ON reminders(user_id, active);

-- Done
SELECT 'Phase 4 migration completed successfully' AS status;
