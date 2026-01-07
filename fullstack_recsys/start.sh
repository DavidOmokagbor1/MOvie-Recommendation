#!/bin/bash

# Movie Recommender App - Startup Script
# This script starts all three services: API, Backend, and Frontend

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo -e "${BLUE}🎬 Movie Recommender App - Starting Services...${NC}"
echo ""

# Set up environment variables
export PATH=/usr/local/Cellar/node/24.2.0/bin:$PATH
export PYTHONPATH=/Users/java/Library/Python/3.9/lib/python/site-packages:$PYTHONPATH

# Kill any existing processes
echo -e "${YELLOW}Cleaning up any existing processes...${NC}"
pkill -f "python.*api.py" 2>/dev/null
pkill -f "python.*run.py" 2>/dev/null
pkill -f "react-scripts start" 2>/dev/null
sleep 2

# Start API Server
echo -e "${GREEN}Starting API Server (Port 8000)...${NC}"
cd api
/usr/bin/python3 api.py > /tmp/movie_recsys_api.log 2>&1 &
API_PID=$!
cd ..
echo -e "  ✅ API Server started (PID: $API_PID)"

# Start Backend Server
echo -e "${GREEN}Starting Backend Server (Port 5555)...${NC}"
cd backend
/usr/bin/python3 run.py > /tmp/movie_recsys_backend.log 2>&1 &
BACKEND_PID=$!
cd ..
echo -e "  ✅ Backend Server started (PID: $BACKEND_PID)"

# Start Frontend
echo -e "${GREEN}Starting Frontend (Port 5052)...${NC}"
cd react-front
npm start > /tmp/movie_recsys_frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..
echo -e "  ✅ Frontend started (PID: $FRONTEND_PID)"

# Wait a moment for services to initialize
sleep 3

# Check service status
echo ""
echo -e "${BLUE}📊 Service Status:${NC}"
echo ""

# Check API Server
if curl -s http://127.0.0.1:8000/api/health > /dev/null 2>&1; then
    echo -e "  ✅ API Server (8000): ${GREEN}RUNNING${NC}"
else
    echo -e "  ⏳ API Server (8000): ${YELLOW}Starting...${NC}"
fi

# Check Backend Server
if curl -s http://127.0.0.1:5555/init > /dev/null 2>&1; then
    echo -e "  ✅ Backend Server (5555): ${GREEN}RUNNING${NC}"
else
    echo -e "  ⏳ Backend Server (5555): ${YELLOW}Starting...${NC}"
fi

# Check Frontend
if lsof -i :5052 > /dev/null 2>&1 || lsof -i :3000 > /dev/null 2>&1; then
    echo -e "  ✅ Frontend: ${GREEN}RUNNING${NC}"
else
    echo -e "  ⏳ Frontend: ${YELLOW}Compiling... (may take 1-2 minutes)${NC}"
fi

echo ""
echo -e "${BLUE}🌐 Access your app:${NC}"
echo -e "   Frontend: ${GREEN}http://localhost:5052${NC} (or http://localhost:3000)"
echo -e "   Backend API: http://localhost:5555"
echo -e "   Recommendation API: http://localhost:8000"
echo ""
echo -e "${YELLOW}💡 Note: Frontend may take 1-2 minutes to compile.${NC}"
echo ""
echo -e "${BLUE}📝 Logs:${NC}"
echo "   API: /tmp/movie_recsys_api.log"
echo "   Backend: /tmp/movie_recsys_backend.log"
echo "   Frontend: /tmp/movie_recsys_frontend.log"
echo ""
echo -e "${BLUE}🛑 To stop all services, run:${NC}"
echo "   ./stop.sh"
echo "   or"
echo "   kill $API_PID $BACKEND_PID $FRONTEND_PID"
echo ""






