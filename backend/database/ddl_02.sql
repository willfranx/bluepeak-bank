/*
ddl_02.sql: Second version of BluePeak Bank Database Schema
Defines the following tables:
- Users, Accounts, Transactions tables
- Added timestamps and transaction types
*/

-- Drop existing tables in correct order (testing only)
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Initialize USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    userid SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initialize ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS accounts (
    accountid SERIAL PRIMARY KEY,
    userid INTEGER REFERENCES users(userid)
        ON DELETE CASCADE,         -- Delete user → delete accounts
    type VARCHAR(8) NOT NULL CHECK (type IN ('checking', 'saving')),
    balance NUMERIC(12, 2) DEFAULT 0.00 CHECK (balance >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initialize TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS transactions (
    transactionid SERIAL PRIMARY KEY,
    srcid INTEGER NOT NULL REFERENCES accounts(accountid)
        ON DELETE RESTRICT,        -- Prevent deleting accounts with history
    desid INTEGER NOT NULL REFERENCES accounts(accountid)
        ON DELETE RESTRICT,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0.00),
    type VARCHAR(10) NOT NULL CHECK (type IN ('deposit', 'withdraw', 'transfer')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CHECK (srcid <> desid)
);

-- Initialize SYSTEM ACCOUNT (Bank's internal account)
-- Used for deposits/withdrawals as a neutral source/destination
INSERT INTO accounts (userid, type, balance)
VALUES (NULL, 'checking', 0.00);
