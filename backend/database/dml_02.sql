/*
dml_02.sql: Second version of BluePeak Bank seed data
Includes: Users, Accounts, Transactions
*/

-- ============================================
-- USERS SEED
-- ============================================
-- Passwords here are plain text for example purposes.
-- In production, we always store hashed passwords.
INSERT INTO users (name, email, password) VALUES
('Ahmed', 'ahmed@example.com', '$2b$12$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'), 
('Chris', 'chris@example.com', '$2b$12$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'),
('Keegan', 'keegan@example.com', '$2b$12$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'),
('William', 'william@example.com', '$2b$12$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'),
('Aswin', 'aswin@example.com', '$2b$12$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');

-- ============================================
-- ACCOUNTS SEED
-- ============================================
-- SYSTEM_ACCOUNT_ID = 1 already exists
-- User accounts start from accountid = 2
INSERT INTO accounts (userid, type, balance) VALUES
(1, 'checking', 467.00),
(1, 'saving', 80000.00),
(2, 'saving', 1000.00),
(3, 'checking', 0.01),
(4, 'checking', 800.45),
(4, 'saving', 5000.00),
(5, 'checking', 10000.01),
(5, 'saving', 1000000.00);

-- ============================================
-- TRANSACTIONS SEED
-- ============================================
-- Updated with `type` column
INSERT INTO transactions (srcid, desid, amount, type) VALUES
(2, 1, 467.00, 'transfer'),
(6, 1, 145.45, 'transfer'),
(8, 7, 10.01, 'transfer');
