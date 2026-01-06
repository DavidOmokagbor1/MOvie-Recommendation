#!/bin/bash
# Start React Frontend with proper Node.js PATH

# Add Node.js to PATH if not already there
if ! command -v node &> /dev/null; then
    # Try common Homebrew locations
    if [ -f "/usr/local/Cellar/node/24.2.0/bin/node" ]; then
        export PATH="/usr/local/Cellar/node/24.2.0/bin:$PATH"
    elif [ -f "/opt/homebrew/bin/node" ]; then
        export PATH="/opt/homebrew/bin:$PATH"
    else
        export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"
    fi
fi

# Check if node is available
if ! command -v node &> /dev/null; then
    echo "Error: Node.js not found. Please install Node.js:"
    echo "  brew install node"
    echo "Or add Node.js to your PATH manually"
    exit 1
fi

echo "Using Node.js: $(which node)"
echo "Node version: $(node --version)"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the React app
npm start

