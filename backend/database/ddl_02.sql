/* ddl_02.sql: Second version of the bluepeak-bank Database.

This file defines tables, indexes, and triggers.
- Tables: 
    users, passwords, userevents, events, accounts, and transactions.
- Indexes:
    idx_passwords_current,
    idx_passwords_user,
    idx_userevents_user,
    idx_accounts_user,
    idx_transactions_src,
    idx_transactions_des
- Triggers:
    update_users_updated(),
    update_users_password_updated()
    userevents_user_lock_events()
    userevents_user_creation()
    update_current_password()
*/

DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS accounts CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS passwords CASCADE;
DROP TABLE IF EXISTS userevents CASCADE;
DROP TABLE IF EXISTS events CASCADE;


--################# START DEFINE TABLES ####################
--Initialize users table:
CREATE TABLE IF NOT EXISTS users (
    userid SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(60) UNIQUE NOT NULL,
    emailotp VARCHAR(10),
    emailotpexpires TIMESTAMP,
    isverified BOOLEAN DEFAULT FALSE,
    newemail VARCHAR(60) UNIQUE NULL,
    isnewemailverified BOOLEAN DEFAULT FALSE,
    islocked BOOLEAN DEFAULT FALSE,
    lockoutend TIMESTAMP NULL,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    --updated each time a change to the user or password occurs.
    updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--Initialize passwords Table:
CREATE TABLE IF NOT EXISTS passwords (
    passwordid SERIAL PRIMARY KEY,
    --When a user is deleted all passwords related to the user are deleted.
    userid INTEGER NOT NULL
        REFERENCES users(userid)
        ON DELETE CASCADE,
    hash TEXT NOT NULL,
    iscurrent BOOLEAN DEFAULT TRUE,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--Initialize events Table:
CREATE TABLE IF NOT EXISTS events (
    eventid SERIAL PRIMARY KEY,
    event TEXT UNIQUE NOT NULL,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--Initialize userevents Table:
CREATE TABLE IF NOT EXISTS userevents (
    usereventid SERIAL PRIMARY KEY,
    --When a user is deleted all userevents for the user are deleted.
    userid INTEGER
        REFERENCES users(userid)
        ON DELETE CASCADE,
    --An event cannot be deleted while a userevent references it.
    eventid INTEGER NOT NULL
        REFERENCES events(eventid)
        ON DELETE RESTRICT,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

--Initialize accounts Table:
CREATE TABLE IF NOT EXISTS accounts (
    accountid SERIAL PRIMARY KEY,
    --A user cannot be deleted while accounts reference the user.
    userid INTEGER
        REFERENCES users(userid)
        ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    type VARCHAR(8) NOT NULL
        CHECK (type in ('checking', 'saving')),
    balance NUMERIC(12,2) DEFAULT 0.00,
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP        
);

--Initialize transactions Table:
CREATE TABLE IF NOT EXISTS transactions (
    transactionid SERIAL PRIMARY KEY,
    srcid INTEGER
        REFERENCES accounts(accountid)
        ON DELETE SET NULL,
    desid INTEGER
        REFERENCES accounts(accountid)
        ON DELETE SET NULL,
    --sourceAccount cannot be destinationAccount
    CHECK (srcid <> desid),
    amount NUMERIC(12,2) NOT NULL
        --no negative transfer amounts
        CHECK (amount > 0.00),
    type VARCHAR(10) NOT NULL CHECK (type IN ('deposit', 'withdraw', 'transfer')),
    created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    approved BOOLEAN NOT NULL DEFAULT FALSE,
    approvedtime TIMESTAMP NULL,
    complete BOOLEAN NOT NULL DEFAULT FALSE,
    completetime TIMESTAMP NULL
);
--################# END DEFINE TABLES ####################

-- Initialize SYSTEM ACCOUNT (Bank's internal account)
-- Used for deposits/withdrawals as a neutral source/destination
INSERT INTO accounts (userid, name, type, balance)
VALUES (NULL, 'SYS_ACC', 'checking', 0.00);

--################# START DEFINE INDEXES #################

--Fast lookup for a users current password:
CREATE INDEX idx_passwords_current ON passwords(userid, iscurrent);

--Fast lookup for all a users related passwords:
CREATE INDEX idx_passwords_user ON passwords(userid);

--Fast lookup for a users userevents:
CREATE INDEX idx_userevents_user ON userevents(userid);

--Fast lookup for user accounts:
CREATE INDEX idx_accounts_user ON accounts(userid);

--Fast lookup for transaction source accounts:
CREATE INDEX idx_transactions_src ON transactions(srcid);

--Destination account transaction index:
CREATE INDEX idx_transactions_des ON transactions(desid);

--################# END DEFINE INDEXES ###################

--################# START DEFINE TRIGGERS ################

--Function: auto-update users.updated when user is modified:
CREATE OR REPLACE FUNCTION update_users_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--Trigger: update_users_updated():
CREATE TRIGGER trigger_users_updated
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated();

--Function: auto-update users.updated when a new password is applied:
CREATE OR REPLACE FUNCTION update_users_password_updated()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE users
    SET updated = CURRENT_TIMESTAMP
    WHERE userid = NEW.userid;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--Trigger: update_users_password_updated():
CREATE TRIGGER trigger_users_password_updated
    AFTER INSERT ON passwords
    FOR EACH ROW
    EXECUTE FUNCTION update_users_password_updated();

--Function: record user lock and unlock event in userevents:
CREATE OR REPLACE FUNCTION userevents_user_lock_events()
RETURNS TRIGGER AS $$
DECLARE
    lock_event_id INT;
BEGIN
    --Case: user got locked
    IF NEW.islocked = TRUE AND OLD.islocked = FALSE THEN
        SELECT eventid INTO lock_event_id FROM events WHERE event = 'Account Locked';
        IF lock_event_id IS NOT NULL THEN
            INSERT INTO userevents(userid, eventid)
            VALUES (NEW.userid, lock_event_id);
        END IF;
    --Case: user got unlocked
    ELSIF NEW.islocked = FALSE AND OLD.islocked = TRUE THEN
        SELECT eventid INTO lock_event_id FROM events WHERE event = 'Account Unlocked';
        IF lock_event_id IS NOT NULL THEN
            INSERT INTO userevents(userid, eventid)
            VALUES (NEW.userid, lock_event_id);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--Trigger: userevents_user_lock_events():
CREATE TRIGGER trigger_user_lock_events
    AFTER UPDATE OF islocked ON users
    FOR EACH ROW
    WHEN (OLD.islocked IS DISTINCT FROM NEW.islocked)
    EXECUTE FUNCTION userevents_user_lock_events();

--Function: record user account creation in userevents:
CREATE OR REPLACE FUNCTION userevents_user_creation()
RETURNS TRIGGER AS $$
DECLARE
    user_creation_id INT;
BEGIN
    SELECT eventid INTO user_creation_id FROM events WHERE event = 'Account Created';
    IF user_creation_id IS NOT NULL THEN
        INSERT INTO userevents(userid, eventid)
        VALUES (NEW.userid, user_creation_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--Trigger: userevents_user_creation():
CREATE TRIGGER trigger_user_creation_event
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION userevents_user_creation();

--Function auto-update passwords.iscurrent when a user updates their password
--   Record in the userevents table
CREATE OR REPLACE FUNCTION update_current_password()
RETURNS TRIGGER AS $$
DECLARE
    password_updated_event_id int;
BEGIN
    --Mark the old password as iscurrent=FALSE (if there is one)
    UPDATE passwords
    SET iscurrent = FALSE
    WHERE userid = NEW.userid
        AND iscurrent = TRUE;

    --Record the event in the userevents table
    SELECT eventid INTO password_updated_event_id FROM events WHERE event = 'Password Updated';
    IF password_updated_event_id IS NOT NULL THEN
        INSERT INTO userevents(userid, eventid)
        VALUES (NEW.userid, password_updated_event_id);
    END IF;

    --Allow the query to proceed
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--Trigger update_current_password()
Create TRIGGER trigger_update_current_password
BEFORE INSERT ON passwords
FOR EACH ROW
EXECUTE FUNCTION update_current_password();
--################# END DEFINE TRIGGERS ##################