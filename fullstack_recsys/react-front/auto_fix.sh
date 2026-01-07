#!/bin/bash

# Auto fix script for React app deployment

echo "Installing dependencies..."
npm install

echo "Building React app..."
npm run build

echo "Build completed successfully!"

