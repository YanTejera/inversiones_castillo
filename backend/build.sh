#!/usr/bin/env bash
# Build script for Render deployment
set -o errexit  # Exit on error

echo "🚀 Starting build process..."

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Collect static files
echo "📂 Collecting static files..."
python manage.py collectstatic --no-input

# Run database migrations
echo "🗄️ Running database migrations..."
python manage.py migrate

# Create initial data (roles and admin user)
echo "👤 Creating initial data..."
python create_initial_data.py

echo "✅ Build completed successfully!"