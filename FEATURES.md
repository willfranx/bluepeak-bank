# BluePeak Bank - Features Documentation

## Application Overview

BluePeak Bank is a simulated banking web application designed for security testing and penetration testing practice. It implements core banking functionality without handling real money.

## Pages

### 1. Login/Registration Page (`/`)

**Features:**
- User login with username and password
- New user registration
- Toggle between login and registration forms
- JWT token-based authentication
- Form validation

**Security Considerations:**
- Passwords are hashed using bcrypt
- JWT tokens for session management
- Basic input validation

### 2. View Balances Page (`/dashboard`)

**Features:**
- Display current account balance
- Show account username
- Display transaction history (last 50 transactions)
- Color-coded transactions (green for received, red for sent)
- Timestamp for each transaction
- Navigation to transfer page
- Logout functionality

**Data Displayed:**
- Current balance in USD
- Transaction sender/recipient
- Transaction amount
- Transaction date and time

### 3. Transfer Funds Page (`/transfer`)

**Features:**
- Transfer funds to another user by username
- Real-time balance display
- Input validation (amount must be positive)
- Transaction confirmation messages
- Balance updates after successful transfer
- Navigation back to dashboard
- Logout functionality

**Validation:**
- Recipient username must exist
- Amount must be positive
- Sender must have sufficient balance
- Cannot transfer to yourself

## API Endpoints

### Authentication Endpoints

#### POST `/api/auth/register`
Create a new user account.

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "username": "john_doe",
    "balance": "1000.00"
  }
}
```

#### POST `/api/auth/login`
Login to an existing account.

**Request Body:**
```json
{
  "username": "john_doe",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "username": "john_doe",
    "balance": "1000.00"
  }
}
```

### Banking Endpoints (Require Authentication)

All banking endpoints require a valid JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

#### GET `/api/banking/balance`
Get current user's balance.

**Response:**
```json
{
  "id": 1,
  "username": "john_doe",
  "balance": "1000.00"
}
```

#### POST `/api/banking/transfer`
Transfer funds to another user.

**Request Body:**
```json
{
  "toUsername": "jane_smith",
  "amount": "50.00"
}
```

**Response:**
```json
{
  "message": "Transfer successful",
  "newBalance": "950.00",
  "transfer": {
    "from": "john_doe",
    "to": "jane_smith",
    "amount": "50.00"
  }
}
```

#### GET `/api/banking/transactions`
Get transaction history for the current user.

**Response:**
```json
[
  {
    "id": 1,
    "amount": "50.00",
    "created_at": "2024-01-15T10:30:00Z",
    "from_username": "john_doe",
    "to_username": "jane_smith"
  },
  {
    "id": 2,
    "amount": "25.00",
    "created_at": "2024-01-15T09:15:00Z",
    "from_username": "jane_smith",
    "to_username": "john_doe"
  }
]
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  balance DECIMAL(10, 2) DEFAULT 1000.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Transactions Table
```sql
CREATE TABLE transactions (
  id SERIAL PRIMARY KEY,
  from_user_id INTEGER REFERENCES users(id),
  to_user_id INTEGER REFERENCES users(id),
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## User Flow

1. **First Time User:**
   - Visit http://localhost:3000
   - Click "Create one" to register
   - Enter username and password
   - Automatically logged in and redirected to dashboard
   - Starts with $1000.00 balance

2. **Returning User:**
   - Visit http://localhost:3000
   - Enter username and password
   - Click "Login"
   - Redirected to dashboard

3. **View Balances:**
   - See current balance at top of page
   - View transaction history below
   - Transactions show sender/recipient and amount
   - Color-coded for easy identification

4. **Transfer Funds:**
   - Click "Transfer Funds" button
   - Enter recipient's username
   - Enter amount to transfer
   - Click "Transfer"
   - See confirmation message
   - Updated balance displayed

5. **Logout:**
   - Click "Logout" button on any page
   - Redirected to login page
   - Session token cleared

## Security Features (Implemented)

- Password hashing with bcrypt
- JWT token-based authentication
- Protected routes (require authentication)
- SQL parameterized queries (prevent SQL injection)
- CORS enabled
- Transaction atomicity (database transactions)
- Balance validation before transfer

## Known Vulnerabilities (Intentional for Testing)

This application is intentionally vulnerable for security testing purposes:

- No rate limiting on login attempts
- Simple JWT secret (should be complex in production)
- No CSRF protection
- No input sanitization in some areas
- No account lockout after failed attempts
- No email verification
- No password complexity requirements
- No 2FA/MFA
- No session timeout
- No IP-based restrictions

## Testing the Application

### Create Multiple Users for Testing

Use curl or Postman to create test users:

```bash
# Create first user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"password123"}'

# Create second user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"bob","password":"password123"}'
```

### Test Transfer Between Users

1. Login as alice in the web interface
2. Transfer funds to bob
3. Logout and login as bob
4. Verify the balance increased
5. Check transaction history

## Technology Stack

- **Frontend:** React 19.2, React Router, Axios, Vite
- **Backend:** Node.js, Express 5.1, JWT, bcrypt
- **Database:** PostgreSQL
- **Build Tools:** Vite (frontend), npm (package management)

## Development

### Run in Development Mode

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### Build for Production

**Frontend:**
```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/`

## Troubleshooting

### Cannot connect to database
- Ensure PostgreSQL is running
- Check database credentials in `backend/.env`
- Verify database `bluepeak_bank` exists

### Backend won't start
- Check if port 3001 is available
- Verify all dependencies are installed: `npm install`
- Check database connection settings

### Frontend won't start
- Check if port 3000 is available
- Verify all dependencies are installed: `npm install`
- Clear browser cache

### API calls fail with 401
- Token may have expired (24 hour expiry)
- Logout and login again
- Check if backend is running

### Transfers fail
- Ensure recipient username exists
- Check if sender has sufficient balance
- Verify amount is positive number
