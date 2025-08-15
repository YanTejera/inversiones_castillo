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

# Copy _redirects file for SPA routing (multiple methods)
echo "🔗 Copying _redirects file for SPA routing..."

# Method 1: Copy from public/ (Vite should handle this automatically)
if [ -f "public/_redirects" ]; then
    cp public/_redirects dist/_redirects
    echo "✅ _redirects file copied from public/ directory"
fi

# Method 2: Copy from root as backup
if [ -f "_redirects" ]; then
    cp _redirects dist/_redirects
    echo "✅ _redirects file copied from root directory as backup"
fi

# Method 3: Force create if neither exists
if [ ! -f "dist/_redirects" ]; then
    echo "/* /index.html 200" > dist/_redirects
    echo "✅ Created fallback _redirects file"
fi

# Method 4: Also create _redirects in multiple locations for Render
echo "/* /index.html 200" > dist/_redirects
echo "/* /index.html 200" > ./_redirects
echo "✅ Force created _redirects in dist/ and root"

# Verify _redirects file was created
echo "🔍 Verifying _redirects file:"
if [ -f "dist/_redirects" ]; then
    echo "✅ _redirects exists in dist/"
    echo "📄 Contents of dist/_redirects:"
    cat dist/_redirects
else
    echo "❌ _redirects NOT found in dist/"
fi
echo "📂 Final dist/ contents:"
ls -la dist/

echo "✅ Frontend build completed successfully!"
echo "📁 Build files are in ./dist directory"
echo "🔗 _redirects file copied for SPA routing"