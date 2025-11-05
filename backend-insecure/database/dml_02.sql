/*
dml_02.sql: Second version of BluePeak Bank seed data
Includes: Users, Accounts, Transactions
*/

-- ============================================
-- EVENT SEEDS
-- ============================================
-- Events are recorded in user events. 
-- Events must be initialized first so triggers can find the event ID to record actions.
INSERT INTO events (event)
VALUES
('Account Created'),
('Successful Authentication'),
('Failed Authentication'),
('Account Locked'),
('Account Unlocked'),
('Log Out'),
('Password Updated');

-- ============================================
-- USERS SEED
-- ============================================
-- Passwords here are plain text for example purposes.
-- In production, we always store hashed passwords.
INSERT INTO users (name, email, phonenumber) VALUES
('ahmed', 'ahmed@example.com', '+15551234567'),
('chris', 'chris@example.com', '+15559876543'),
('keegan', 'keegan@example.com', NULL),
('william', 'william@example.com', '+15557654321'),
('aswin', 'aswin@example.com', '+15553456789');

-- ============================================
-- PASSWORD SEEDS
-- ============================================
-- Passwords here are plain text for example purposes.
-- In production, we always store hashed passwords.
-- salt is not private info and unique to each entry
INSERT INTO passwords (userid, salt, hash, algorithm, iscurrent)
VALUES
(1, 'salt', '2b$12$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'argon2id', TRUE),
(3, 'salt', '2b$12$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'argon2id', TRUE),
(2, 'salt', '2b$12$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'argon2id', TRUE),
(4, 'salt', '2b$12$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'argon2id', TRUE),
(5, 'salt', '2b$12$xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', 'argon2id', TRUE);

-- ============================================
-- ACCOUNTS SEED
-- ============================================
-- SYSTEM_ACCOUNT_ID = 1 already exists
-- User accounts start from accountid = 2
INSERT INTO accounts (userid, name, type, balance) VALUES
(1, 'Ahmed Checking', 'checking', 467.00),
(1, 'Ahmed Savings', 'saving', 80000.00),
(2, 'Chris Checking', 'checking', 200.00),
(2, 'Chris Savings', 'saving', 1000.00),
(3, 'Keegan Checking', 'checking', 0.01),
(3, 'Keegan Savings', 'saving', 500.00),
(4, 'William Checking', 'checking', 800.45),
(4, 'William Savings', 'saving', 5000.00),
(5, 'Aswin Checking', 'checking', 10000.01),
(5, 'Aswin Savings', 'saving', 1000000.00);

-- ============================================
-- TRANSACTIONS SEED
-- ============================================
-- Updated with `type` column
INSERT INTO transactions (srcid, desid, amount, type, approved, complete) VALUES
(2, 1, 467.00, 'transfer', TRUE, TRUE),
(6, 1, 145.45, 'transfer', TRUE, TRUE),
(8, 7, 10.01, 'transfer', TRUE, TRUE);
