#!/bin/bash
# Build script for ML API on Render
# This ensures we're in the right directory and install dependencies

set -e  # Exit on any error

echo "=== ML API Build Script ==="
echo "Current directory: $(pwd)"
echo "Listing files:"
ls -la

# Find requirements.txt
REQ_FILE=""
if [ -f "requirements.txt" ]; then
    REQ_FILE="requirements.txt"
    echo "Found requirements.txt in current directory"
elif [ -f "api/requirements.txt" ]; then
    echo "Changing to api directory"
    cd api
    REQ_FILE="requirements.txt"
elif [ -f "fullstack_recsys/api/requirements.txt" ]; then
    echo "Changing to fullstack_recsys/api directory"
    cd fullstack_recsys/api
    REQ_FILE="requirements.txt"
fi

if [ -z "$REQ_FILE" ] || [ ! -f "$REQ_FILE" ]; then
    echo "ERROR: requirements.txt not found!"
    echo "Current directory: $(pwd)"
    echo "Files in current directory:"
    ls -la
    exit 1
fi

echo "Final directory: $(pwd)"
echo "Using requirements file: $REQ_FILE"
echo "Contents of $REQ_FILE (first 5 lines):"
head -5 "$REQ_FILE"

# Upgrade pip
echo "Upgrading pip, setuptools, and wheel..."
python -m pip install --upgrade pip setuptools wheel

# Install dependencies
echo "Installing dependencies from $REQ_FILE..."
python -m pip install -r "$REQ_FILE"

echo "=== Build completed successfully ==="
