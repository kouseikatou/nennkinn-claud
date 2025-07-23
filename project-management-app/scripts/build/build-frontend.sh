#!/bin/bash

# Frontend Build Script
set -e

echo "=== Frontend Build Started ==="

# Change to frontend directory
cd "$(dirname "$0")/../../frontend"

echo "1. Installing dependencies..."
npm ci

echo "2. Type checking..."
npm run type-check

echo "3. Linting..."
npm run lint

echo "4. Building application..."
npm run build

echo "5. Build completed successfully!"
echo "Output directory: ./dist"

# Show build stats
if [ -d "dist" ]; then
    echo "Build artifacts:"
    ls -la dist/
    du -sh dist/
fi

echo "=== Frontend Build Completed ==="