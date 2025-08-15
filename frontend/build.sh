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
if [ -f "public/_redirects" ]; then
    cp public/_redirects dist/_redirects
    echo "✅ _redirects file copied successfully"
else
    echo "⚠️ _redirects file not found in public/ directory"
    echo "📂 Current directory: $(pwd)"
    echo "📂 Contents of public/: $(ls -la public/ 2>/dev/null || echo 'public/ not found')"
fi

echo "✅ Frontend build completed successfully!"
echo "📁 Build files are in ./dist directory"
echo "🔗 _redirects file copied for SPA routing"