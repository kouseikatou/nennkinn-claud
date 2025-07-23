#!/bin/bash

# Cloud Functions Deploy Script
set -e

echo "=== Cloud Functions Deploy Started ==="

# Change to backend directory
cd "$(dirname "$0")/../../backend"

echo "1. Installing dependencies..."
npm ci

echo "2. Type checking..."
npx tsc --noEmit

echo "3. Linting..."
npm run lint

echo "4. Building functions..."
npm run build

echo "5. Deploying to Firebase..."
if [ "$1" = "production" ]; then
    echo "Deploying to PRODUCTION environment..."
    firebase deploy --only functions --project production
else
    echo "Deploying to STAGING environment..."
    firebase deploy --only functions --project staging
fi

echo "6. Deploy completed successfully!"

echo "=== Cloud Functions Deploy Completed ==="