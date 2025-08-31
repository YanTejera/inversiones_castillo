#!/usr/bin/env bash
# Build script for Render deployment
set -o errexit  # Exit on error

echo "[BUILD] Starting build process..."

# Install Python dependencies
echo "[PKG] Installing Python dependencies..."
pip install -r requirements.txt

# Collect static files
echo "[STATIC] Collecting static files..."
python manage.py collectstatic --no-input

# Run database migrations
echo "[DB] Running database migrations..."
python manage.py migrate

# Create initial data (roles and admin user)
echo "[USER] Creating initial data..."
python create_initial_data.py

echo "[OK] Build completed successfully!"