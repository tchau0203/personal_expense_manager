-- PostgreSQL schema for personal expense manager

CREATE DATABASE personal_expense_manager;

\c personal_expense_manager;

CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    amount NUMERIC(12,2) NOT NULL,
    category TEXT NOT NULL,
    expense_date DATE NOT NULL
);

-- Optional: create a dedicated role/user if you want to use one
-- CREATE ROLE app_user WITH LOGIN PASSWORD 'postgres';
-- GRANT ALL PRIVILEGES ON DATABASE personal_expense_manager TO app_user;
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_user;
