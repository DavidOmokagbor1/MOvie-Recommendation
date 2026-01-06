#!/bin/bash

# Simple Local Startup Script
# Starts all services for localhost development

echo "🎬 Starting Movie Recommender (Localhost)..."
echo ""

# Kill existing processes
echo "Cleaning up..."
pkill -f "python.*api.py" 2>/dev/null
pkill -f "python.*run.py" 2>/dev/null
pkill -f "react-scripts" 2>/dev/null
sleep 1

# Start ML API (Port 8000)
echo "📡 Starting ML API on port 8000..."
cd fullstack_recsys/api
python3 api.py > /tmp/ml_api.log 2>&1 &
ML_PID=$!
cd ../..
sleep 2

# Start Backend (Port 5555)
echo "🔧 Starting Backend on port 5555..."
cd fullstack_recsys/backend
python3 run.py > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
cd ../..
sleep 2

# Start Frontend (Port 5052)
echo "🎨 Starting Frontend on port 5052..."
cd fullstack_recsys/react-front
PORT=5052 npm start > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
cd ../..
sleep 3

echo ""
echo "✅ All services starting..."
echo ""
echo "🌐 Access your app at: http://localhost:5052"
echo ""
echo "📝 Logs:"
echo "   ML API: tail -f /tmp/ml_api.log"
echo "   Backend: tail -f /tmp/backend.log"
echo "   Frontend: tail -f /tmp/frontend.log"
echo ""
echo "🛑 To stop: kill $ML_PID $BACKEND_PID $FRONTEND_PID"
echo ""

