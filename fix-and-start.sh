#!/bin/bash

# Comprehensive fix and start script for Movie Recommender
# This script will diagnose issues and start all services properly

echo "🔍 Diagnosing and fixing Movie Recommender setup..."
echo ""

# Step 1: Kill all existing processes
echo "1️⃣  Cleaning up existing processes..."
pkill -f "python.*api.py" 2>/dev/null
pkill -f "python.*run.py" 2>/dev/null
pkill -f "react-scripts" 2>/dev/null
sleep 2

# Step 2: Check ports
echo "2️⃣  Checking ports..."
if lsof -ti:8000 > /dev/null 2>&1; then
    echo "   ⚠️  Port 8000 is still in use, killing process..."
    kill -9 $(lsof -ti:8000) 2>/dev/null
    sleep 1
fi

if lsof -ti:5555 > /dev/null 2>&1; then
    echo "   ⚠️  Port 5555 is still in use, killing process..."
    kill -9 $(lsof -ti:5555) 2>/dev/null
    sleep 1
fi

# Step 3: Verify .env file exists
echo "3️⃣  Checking MongoDB configuration..."
cd /Users/java/.cursor/worktrees/MOVIE-RECOMMENDER/jik/fullstack_recsys/backend
if [ ! -f .env ]; then
    echo "   ❌ .env file not found! Creating it..."
    cat > .env << 'EOF'
MONGODB_URI=mongodb+srv://username:password@movierecommender.x0gaqcb.mongodb.net/?appName=MovieRecommender
MONGODB_DB_NAME=movierecommender
FLASK_ENV=development
SECRET_KEY=dev-secret-key-change-in-production
EOF
    echo "   ✅ .env file created"
else
    echo "   ✅ .env file exists"
fi

# Step 4: Test MongoDB connection
echo "4️⃣  Testing MongoDB connection..."
if python3 test_mongodb.py 2>&1 | grep -q "Successfully connected"; then
    echo "   ✅ MongoDB connection working"
else
    echo "   ⚠️  MongoDB connection test failed (but continuing anyway)"
fi

# Step 5: Start ML API
echo "5️⃣  Starting ML API on port 8000..."
cd /Users/java/.cursor/worktrees/MOVIE-RECOMMENDER/jik/fullstack_recsys/api
python3 api.py > /tmp/ml_api.log 2>&1 &
ML_PID=$!
sleep 3

# Check if ML API started
if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
    echo "   ✅ ML API is running (PID: $ML_PID)"
else
    echo "   ⚠️  ML API may not have started properly. Check /tmp/ml_api.log"
fi

# Step 6: Start Backend
echo "6️⃣  Starting Backend on port 5555..."
cd /Users/java/.cursor/worktrees/MOVIE-RECOMMENDER/jik/fullstack_recsys/backend
python3 run.py > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
sleep 3

# Check if Backend started
if curl -s http://localhost:5555/api/stats > /dev/null 2>&1; then
    echo "   ✅ Backend is running (PID: $BACKEND_PID)"
else
    echo "   ⚠️  Backend may not have started properly. Check /tmp/backend.log"
fi

# Step 7: Test the connection
echo "7️⃣  Testing Backend -> ML API connection..."
sleep 2
TEST_RESULT=$(curl -s -X POST http://localhost:5555/recommend \
  -H "Content-Type: application/json" \
  -d '{"context": [1, 2, 3], "model": "ItemKNN"}' 2>&1)

if echo "$TEST_RESULT" | grep -q "result"; then
    echo "   ✅ Backend can connect to ML API!"
else
    echo "   ⚠️  Connection test failed. Response:"
    echo "$TEST_RESULT" | head -3
fi

# Step 8: Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 Service Status Summary"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "ML API (Port 8000):"
if curl -s http://localhost:8000/api/health > /dev/null 2>&1; then
    echo "   ✅ RUNNING - http://localhost:8000"
else
    echo "   ❌ NOT RUNNING - Check /tmp/ml_api.log"
fi

echo ""
echo "Backend (Port 5555):"
if curl -s http://localhost:5555/api/stats > /dev/null 2>&1; then
    echo "   ✅ RUNNING - http://localhost:5555"
    echo "   📊 Stats: $(curl -s http://localhost:5555/api/stats | python3 -c 'import sys, json; d=json.load(sys.stdin); print(f\"{d[\"result\"][\"movies\"]} movies, {d[\"result\"][\"database\"]}\")' 2>/dev/null || echo 'MongoDB connected')"
else
    echo "   ❌ NOT RUNNING - Check /tmp/backend.log"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎯 Next Steps:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Run full tests:"
echo "   cd /Users/java/.cursor/worktrees/MOVIE-RECOMMENDER/jik/fullstack_recsys/backend"
echo "   python3 test_endpoints.py"
echo ""
echo "2. Start frontend (in a new terminal):"
echo "   cd /Users/java/.cursor/worktrees/MOVIE-RECOMMENDER/jik/fullstack_recsys/react-front"
echo "   PORT=5052 npm start"
echo ""
echo "3. View logs:"
echo "   tail -f /tmp/ml_api.log      # ML API logs"
echo "   tail -f /tmp/backend.log    # Backend logs"
echo ""
echo "4. Stop all services:"
echo "   kill $ML_PID $BACKEND_PID"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
