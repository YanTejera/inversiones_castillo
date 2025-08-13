#!/usr/bin/env bash
# Build script for FREE Render deployment with SQLite
set -o errexit

echo "🆓 Starting FREE build process with SQLite..."

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Create SQLite database directory
echo "🗄️ Setting up SQLite database..."
mkdir -p db_data

# Collect static files
echo "📂 Collecting static files..."
python manage.py collectstatic --no-input

# Run database migrations
echo "🗄️ Running SQLite migrations..."
python manage.py migrate

# Create initial data (roles and admin user)
echo "👤 Creating initial data..."
python create_initial_data.py

echo "✅ FREE build completed successfully!"
echo "💡 Using SQLite - Perfect for development and testing!"