#!/usr/bin/env bash
# Build script for FREE Render deployment with SQLite
set -o errexit

echo "[FREE] Starting FREE build process with SQLite..."

# Install Python dependencies
echo "[PKG] Installing Python dependencies..."
pip install -r requirements.txt

# Create SQLite database directory
echo "[DB] Setting up SQLite database..."
mkdir -p db_data

# Collect static files
echo "[STATIC] Collecting static files..."
python manage.py collectstatic --no-input

# Run database migrations
echo "[DB] Running SQLite migrations..."
python manage.py migrate

# Create initial data (roles and admin user)
echo "[USER] Creating initial data..."
python create_initial_data.py

echo "[OK] FREE build completed successfully!"
echo "[INFO] Using SQLite - Perfect for development and testing!"