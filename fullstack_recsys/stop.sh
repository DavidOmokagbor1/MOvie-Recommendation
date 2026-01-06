#!/bin/bash

# Movie Recommender App - Stop Script
# This script stops all running services

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🛑 Stopping Movie Recommender App Services...${NC}"
echo ""

# Stop API Server
echo -e "Stopping API Server..."
pkill -f "python.*api.py" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "  ${GREEN}✅ API Server stopped${NC}"
else
    echo -e "  ${RED}⚠️  API Server was not running${NC}"
fi

# Stop Backend Server
echo -e "Stopping Backend Server..."
pkill -f "python.*run.py" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "  ${GREEN}✅ Backend Server stopped${NC}"
else
    echo -e "  ${RED}⚠️  Backend Server was not running${NC}"
fi

# Stop Frontend
echo -e "Stopping Frontend..."
pkill -f "react-scripts start" 2>/dev/null
if [ $? -eq 0 ]; then
    echo -e "  ${GREEN}✅ Frontend stopped${NC}"
else
    echo -e "  ${RED}⚠️  Frontend was not running${NC}"
fi

sleep 1

echo ""
echo -e "${GREEN}✅ All services stopped!${NC}"
echo ""





