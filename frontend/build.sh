#!/bin/bash

echo "🌟 Building React Frontend for Production..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🏗️ Building React application..."
npm run build

echo "✅ Frontend build completed successfully!"
echo "📁 Build files are in ./dist directory"