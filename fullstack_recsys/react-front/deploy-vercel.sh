#!/bin/bash

# Simple Vercel Deployment Script
# This script will help you deploy your React app to Vercel

set -e  # Exit on error

echo "🚀 Starting Vercel Deployment Process..."
echo ""

# Step 1: Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found!"
    echo "Please run this script from the react-front directory"
    exit 1
fi

echo "✅ Found package.json"
echo ""

# Step 2: Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Step 3: Build the app
echo "🔨 Building React app..."
npm run build
echo "✅ Build completed"
echo ""

# Step 4: Check if build directory exists
if [ ! -d "build" ]; then
    echo "❌ Error: build directory not found!"
    echo "Build failed. Please check the errors above."
    exit 1
fi

echo "✅ Build directory exists"
echo ""

# Step 5: Deploy to Vercel
echo "🚀 Deploying to Vercel..."
echo ""
echo "📝 Note: You'll be prompted to:"
echo "   1. Login (if not already logged in)"
echo "   2. Select your account/team"
echo "   3. Confirm project settings"
echo ""

vercel --prod

echo ""
echo "✅ Deployment process completed!"
echo ""
echo "📋 Next Steps:"
echo "   1. Set environment variables in Vercel dashboard:"
echo "      - REACT_APP_API_URL = https://movie-recommender-backend.onrender.com"
echo "      - REACT_APP_ML_API_URL = https://movie-recommender-ml-api.onrender.com"
echo "   2. Redeploy after setting environment variables"
echo ""

