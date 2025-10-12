# Testing Guide for BluePeak Bank

This guide provides step-by-step instructions for testing the BluePeak Bank application.

## Prerequisites

Before testing, ensure:
- PostgreSQL is installed and running
- Node.js is installed (v14+)
- Backend server is running on port 3001
- Frontend server is running on port 3000

## Quick Start

```bash
# Terminal 1 - Start backend
cd backend
npm install
npm start

# Terminal 2 - Start frontend
cd frontend
npm install
npm run dev
```

## Test Scenarios

### Test 1: User Registration

**Steps:**
1. Open http://localhost:3000
2. Click "Create one" link
3. Enter username: `testuser1`
4. Enter password: `password123`
5. Click "Create Account"

**Expected Result:**
- User is created successfully
- Redirected to dashboard
- Balance shows $1000.00
- No transaction history

### Test 2: User Login

**Steps:**
1. Click "Logout" if logged in
2. Enter username: `testuser1`
3. Enter password: `password123`
4. Click "Login"

**Expected Result:**
- Login successful
- Redirected to dashboard
- Balance and transactions are displayed

### Test 3: View Balance and Transactions

**Steps:**
1. Login as any user
2. View the dashboard

**Expected Result:**
- Current balance is displayed at top
- Transaction history shows below
- Transactions are color-coded (green=received, red=sent)
- Each transaction shows date, time, and amount

### Test 4: Transfer Funds - Success

**Setup:**
Create two users first:
- User A: `alice` / `password123`
- User B: `bob` / `password123`

**Steps:**
1. Login as `alice`
2. Note current balance
3. Click "Transfer Funds"
4. Enter recipient: `bob`
5. Enter amount: `50`
6. Click "Transfer"

**Expected Result:**
- Success message appears
- Alice's balance decreases by $50.00
- Transaction appears in history

**Verify:**
1. Logout and login as `bob`
2. Bob's balance should have increased by $50.00
3. Transaction appears in Bob's history

### Test 5: Transfer Funds - Insufficient Balance

**Steps:**
1. Login as a user with $100 balance
2. Click "Transfer Funds"
3. Enter recipient: (any valid username)
4. Enter amount: `200`
5. Click "Transfer"

**Expected Result:**
- Error message: "Insufficient balance"
- Balance remains unchanged

### Test 6: Transfer Funds - Invalid Recipient

**Steps:**
1. Login as any user
2. Click "Transfer Funds"
3. Enter recipient: `nonexistentuser999`
4. Enter amount: `10`
5. Click "Transfer"

**Expected Result:**
- Error message: "Recipient not found"
- Balance remains unchanged

### Test 7: Transfer to Self

**Steps:**
1. Login as `alice`
2. Click "Transfer Funds"
3. Enter recipient: `alice`
4. Enter amount: `10`
5. Click "Transfer"

**Expected Result:**
- Error message: "Cannot transfer to yourself"

### Test 8: Navigation

**Steps:**
1. Login as any user
2. Click "Transfer Funds" button
3. Verify page changes to Transfer Funds
4. Click "View Balances" button
5. Verify page changes back to dashboard

**Expected Result:**
- Navigation works smoothly
- Data persists across page changes
- Active button is highlighted

### Test 9: Logout

**Steps:**
1. Login as any user
2. Click "Logout" button

**Expected Result:**
- Redirected to login page
- Cannot access /dashboard or /transfer directly
- Token removed from localStorage

### Test 10: Protected Routes

**Steps:**
1. Ensure you're logged out
2. Try to navigate directly to: http://localhost:3000/dashboard
3. Try to navigate directly to: http://localhost:3000/transfer

**Expected Result:**
- Both URLs redirect to login page (/)
- No sensitive data is displayed

## API Testing with curl

### Register a User

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass"}'
```

### Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass"}'
```

Save the token from the response.

### Get Balance

```bash
curl -X GET http://localhost:3001/api/banking/balance \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Transfer Funds

```bash
curl -X POST http://localhost:3001/api/banking/transfer \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{"toUsername":"recipient","amount":"25.50"}'
```

### Get Transactions

```bash
curl -X GET http://localhost:3001/api/banking/transactions \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Database Verification

Connect to PostgreSQL to verify data:

```bash
psql -U postgres -d bluepeak_bank
```

### Check Users

```sql
SELECT id, username, balance, created_at FROM users;
```

### Check Transactions

```sql
SELECT 
  t.id,
  sender.username as from_user,
  recipient.username as to_user,
  t.amount,
  t.created_at
FROM transactions t
LEFT JOIN users sender ON t.from_user_id = sender.id
LEFT JOIN users recipient ON t.to_user_id = recipient.id
ORDER BY t.created_at DESC;
```

## Security Testing Scenarios

### SQL Injection Test

Try entering SQL in username field:
```
' OR '1'='1
```

**Note:** Application should be protected by parameterized queries.

### XSS Test

Try entering JavaScript in username:
```
<script>alert('XSS')</script>
```

**Note:** Test if input is properly sanitized.

### Brute Force Test

Try multiple login attempts with wrong password.

**Note:** No rate limiting is implemented (intentional vulnerability).

### JWT Tampering

1. Get a valid token
2. Modify the payload
3. Try to use it
4. Should fail with "Invalid token"

## Performance Testing

### Create Multiple Users

```bash
for i in {1..10}; do
  curl -X POST http://localhost:3001/api/auth/register \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"user$i\",\"password\":\"pass$i\"}"
done
```

### Create Multiple Transactions

Login as each user and transfer funds between them to generate transaction history.

## Common Issues and Solutions

### Backend won't start
- Check if PostgreSQL is running
- Verify database credentials in .env
- Ensure port 3001 is not in use

### Frontend API calls fail
- Verify backend is running on port 3001
- Check browser console for errors
- Verify token is being sent in requests

### Database connection fails
- Ensure PostgreSQL service is running
- Check database name matches configuration
- Verify user has correct permissions

### Transactions not showing
- Refresh the page
- Check if transactions exist in database
- Verify transaction query is working

## Test Results Checklist

- [ ] User registration works
- [ ] User login works
- [ ] Balance is displayed correctly
- [ ] Transfer between users succeeds
- [ ] Insufficient balance is caught
- [ ] Invalid recipient is caught
- [ ] Cannot transfer to self
- [ ] Transaction history displays
- [ ] Navigation works correctly
- [ ] Logout works correctly
- [ ] Protected routes redirect to login
- [ ] API endpoints respond correctly
- [ ] Database stores data correctly

## Reporting Issues

When reporting issues, include:
1. Steps to reproduce
2. Expected behavior
3. Actual behavior
4. Browser console errors (if any)
5. Server logs (if any)
6. Database state (if relevant)
