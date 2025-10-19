/*
ddl_01.sql: Initial version of the bluepeak-bank Database.

defines the following tables: 
Users, Transactions, and Accounts.
*/

--Initialize Users table:
CREATE TABLE IF NOT EXISTS Users (
    userId SERIAL PRIMARY KEY,
    userName VARCHAR(100) UNIQUE,
    password VARCHAR(100)
);

--Initialize Accounts table:
CREATE TABLE IF NOT EXISTS Accounts (
    accountId SERIAL PRIMARY KEY,
    userId INTEGER,
    accountType VARCHAR(8) NOT NULL,
    balance NUMERIC(12,2) DEFAULT 0.00,
    --validate accountType
    CHECK (accountType in ('checking', 'saving')),
    FOREIGN KEY (userId) REFERENCES Users(userId)
        --When a user is deleted, their account is perserved.
        ON DELETE SET NULL                           
);

--Initialize Transactions table:
CREATE TABLE IF NOT EXISTS Transactions (
    transactionId SERIAL PRIMARY KEY,
    sourceAccountId INTEGER NOT NULL,
    destinationAccountId INTEGER NOT NULL,
    amount NUMERIC(12,2) DEFAULT 0.00,
    --no negative transfer amounts
    CHECK (amount > 0.00),
    --sourceAccount cannot be destinationAccount
    Check (sourceAccountId <> destinationAccountId),
    --When an account is deleted the transaction is perserved.
    FOREIGN KEY (sourceAccountId) REFERENCES Accounts(accountId)
        ON DELETE RESTRICT,
    FOREIGN KEY (destinationAccountId) REFERENCES Accounts(accountId)
        ON DELETE RESTRICT
);