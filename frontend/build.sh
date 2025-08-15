#!/bin/bash

echo "🌟 Building React Frontend for Production..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🏗️ Building React application..."
npm run build

# Copy _redirects file for SPA routing
echo "🔗 Copying _redirects file for SPA routing..."
cp public/_redirects dist/_redirects

echo "✅ Frontend build completed successfully!"
echo "📁 Build files are in ./dist directory"
echo "🔗 _redirects file copied for SPA routing"