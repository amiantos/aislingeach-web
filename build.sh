#!/bin/bash

echo "Building Aislingeach Web..."

# Install backend dependencies
echo "Installing backend dependencies..."
npm install

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd vue_client
npm install

# Build frontend
echo "Building frontend..."
npm run build

cd ..

echo "Build complete!"
echo "To run in development: npm run dev"
echo "To run in production: npm start"
