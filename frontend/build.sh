#!/bin/bash

echo "🌟 Building React Frontend for Production..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Debug environment variables
echo "🔍 Environment variables debug:"
echo "VITE_API_URL: $VITE_API_URL"
env | grep VITE || echo "No VITE variables found"

# Build the project
echo "🏗️ Building React application..."
npm run build

# Copy _redirects file for SPA routing
echo "🔗 Copying _redirects file for SPA routing..."
if [ -f "public/_redirects" ]; then
    cp public/_redirects dist/_redirects
    echo "✅ _redirects file copied from public/ directory"
elif [ -f "_redirects" ]; then
    cp _redirects dist/_redirects
    echo "✅ _redirects file copied from root directory"
else
    echo "⚠️ _redirects file not found in public/ or root directory"
    echo "📂 Current directory: $(pwd)"
    echo "📂 Contents: $(ls -la . 2>/dev/null)"
    echo "📂 Contents of public/: $(ls -la public/ 2>/dev/null || echo 'public/ not found')"
    # Create a basic _redirects file as fallback
    echo "/* /index.html 200" > dist/_redirects
    echo "✅ Created fallback _redirects file"
fi

echo "✅ Frontend build completed successfully!"
echo "📁 Build files are in ./dist directory"
echo "🔗 _redirects file copied for SPA routing"