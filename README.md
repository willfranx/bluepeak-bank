# bluepeak-bank
A simple banking web app used to demonstrate security vulnerabilities, test malicious attacks, and mitigations against them.

## Overview

This application simulates a basic banking system with user authentication, balance viewing, and fund transfers. It is intentionally built for security testing and penetration testing practice.

**Warning:** This application is for educational purposes only and should never be used with real financial data or in production environments.

## Features

- User registration and authentication
- Login system with JWT tokens
- View account balance
- Transfer funds between accounts
- Transaction history
- PostgreSQL database backend
- React.js frontend
- RESTful API

## Technology Stack

### Backend
- Node.js
- Express.js
- PostgreSQL
- JWT for authentication
- bcrypt for password hashing

### Frontend
- React.js
- React Router for navigation
- Axios for API calls
- Vite for build tooling

## Prerequisites

- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

OR

- Docker and Docker Compose (for containerized deployment)

## Setup Instructions

### Option 1: Docker Setup (Recommended for Quick Start)

The easiest way to run the application is using Docker Compose:

```bash
# Start all services (database, backend, frontend)
docker-compose up

# Access the application at http://localhost:3000
```

To stop the services:
```bash
docker-compose down
```

### Option 2: Manual Setup

### 1. Database Setup

First, ensure PostgreSQL is installed and running. Create the database:

```bash
# Connect to PostgreSQL
psql -U postgres

# Create the database
CREATE DATABASE bluepeak_bank;

# Exit psql
\q
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
cp .env.example .env

# Edit .env file with your database credentials
# Update DB_USER, DB_PASSWORD, DB_HOST, DB_NAME as needed

# Start the backend server
npm start
```

The backend server will run on `http://localhost:3001`

### 3. Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend application will run on `http://localhost:3000`

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Create a new account by clicking "Create one" on the login page
3. Enter a username and password to register
4. Once logged in, you can:
   - View your account balance on the dashboard
   - See your transaction history
   - Transfer funds to other users by entering their username
   - Navigate between pages using the navigation buttons

## API Endpoints

### Authentication
- `POST /api/auth/register` - Create a new user account
- `POST /api/auth/login` - Login to an existing account

### Banking (Protected Routes)
- `GET /api/banking/balance` - Get current user's balance
- `POST /api/banking/transfer` - Transfer funds to another user
- `GET /api/banking/transactions` - Get transaction history

## Security Notes

This application is intentionally vulnerable for educational purposes. Some known vulnerabilities include:

- Basic JWT implementation
- Simple password requirements
- No rate limiting on API endpoints
- No CSRF protection
- No input sanitization in some areas

**Do not deploy this application to the internet or use it with real data.**

## Development

### Project Structure

```
bluepeak-bank/
├── backend/
│   ├── server.js          # Main server file
│   ├── db.js              # Database connection and initialization
│   ├── auth.js            # Authentication routes
│   ├── banking.js         # Banking routes
│   ├── middleware.js      # JWT authentication middleware
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.jsx        # Main App component
│   │   ├── api.js         # API client
│   │   └── main.jsx       # Entry point
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## License

ISC

