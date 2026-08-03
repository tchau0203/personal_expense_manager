CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    email         VARCHAR(100) NOT NULL UNIQUE,
    password_hash TEXT         NOT NULL,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

INSERT INTO users (username, email, password_hash)
VALUES ('default', 'default@local.com', '$2b$10$placeholder_hash_not_for_login')
ON CONFLICT (username) DO NOTHING;

ALTER TABLE expenses ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE;

UPDATE expenses SET user_id = (SELECT id FROM users WHERE username = 'default') WHERE user_id IS NULL;

ALTER TABLE expenses ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE expenses ADD COLUMN IF NOT EXISTS recurring_interval TEXT DEFAULT NULL;

CREATE TABLE IF NOT EXISTS budgets (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category   TEXT          NOT NULL,
    amount     NUMERIC(12,2) NOT NULL,
    month      SMALLINT      NOT NULL,
    year       SMALLINT      NOT NULL,
    created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, category, month, year)
);

CREATE INDEX IF NOT EXISTS idx_expenses_user_id   ON expenses(user_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date      ON expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month, year)
