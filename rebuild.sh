#!/bin/bash
# =============================================================================
#  UAM — Rebuild Backend
#  Use this when you change Java source files.
#  Usage: ./rebuild.sh
# =============================================================================

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
LOG_DIR="$ROOT_DIR/logs"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

echo ""
echo -e "${YELLOW}▶ Stopping backend...${NC}"
lsof -ti:8080 | xargs kill -9 2>/dev/null || true
sleep 1

echo -e "${YELLOW}▶ Rebuilding backend...${NC}"
cd "$BACKEND_DIR"
mvn package -DskipTests -q && echo -e "${GREEN}  ✅ Build successful${NC}"

echo -e "${YELLOW}▶ Starting backend...${NC}"
mkdir -p "$LOG_DIR"
nohup java -jar target/uam-backend-1.0.0.jar > "$LOG_DIR/backend.log" 2>&1 &
echo $! > "$LOG_DIR/backend.pid"

echo -n "  Waiting for backend"
for i in {1..30}; do
  curl -s http://localhost:8080/health > /dev/null 2>&1 && break
  echo -n "."; sleep 1
done

echo ""
echo -e "${GREEN}  ✅ Backend running on http://localhost:8080${NC}"
echo ""
