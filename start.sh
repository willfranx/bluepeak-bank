#!/bin/bash

# BluePeak Bank - Quick Start Script
# This script helps set up and run the banking application

echo "======================================"
echo "BluePeak Bank - Quick Start"
echo "======================================"
echo ""

# Check if PostgreSQL is running
echo "Checking PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL not found. Please install PostgreSQL first."
    echo "   Visit: https://www.postgresql.org/download/"
    exit 1
fi

echo "✓ PostgreSQL found"
echo ""

# Check if Node.js is installed
echo "Checking Node.js..."
if ! command -v node &> /dev/null; then
    echo "⚠️  Node.js not found. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js found ($(node --version))"
echo ""

# Create database if it doesn't exist
echo "Setting up database..."
psql -U postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'bluepeak_bank'" | grep -q 1 || psql -U postgres -c "CREATE DATABASE bluepeak_bank"
echo "✓ Database ready"
echo ""

# Setup backend
echo "Setting up backend..."
cd backend

if [ ! -f ".env" ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
fi

if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

echo "✓ Backend ready"
echo ""

# Setup frontend
echo "Setting up frontend..."
cd ../frontend

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

echo "✓ Frontend ready"
echo ""

# Instructions
echo "======================================"
echo "Setup complete! To start the application:"
echo ""
echo "1. Start the backend (in one terminal):"
echo "   cd backend && npm start"
echo ""
echo "2. Start the frontend (in another terminal):"
echo "   cd frontend && npm run dev"
echo ""
echo "3. Open your browser to:"
echo "   http://localhost:3000"
echo ""
echo "Default database credentials:"
echo "   User: postgres"
echo "   Password: postgres"
echo "   Database: bluepeak_bank"
echo ""
echo "Update backend/.env if needed."
echo "======================================"
