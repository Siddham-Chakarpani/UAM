#!/bin/bash
# =============================================================================
#  UAM — Start All Services
#  Usage: ./start.sh
# =============================================================================

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/uam-frontend"
LOG_DIR="$ROOT_DIR/logs"

mkdir -p "$LOG_DIR"

# ── Colors ─────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m';  RED='\033[0;31m'; NC='\033[0m'

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║     UAM — User Access Management System              ║${NC}"
echo -e "${CYAN}║     Starting all services…                           ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# ── Kill any existing services on ports 8080 / 5173 ───────────────────────
echo -e "${YELLOW}▶ Stopping any existing services...${NC}"
lsof -ti:8080 | xargs kill -9 2>/dev/null && echo "  Killed process on :8080" || echo "  Port 8080 is free"
lsof -ti:5173 | xargs kill -9 2>/dev/null && echo "  Killed process on :5173" || echo "  Port 5173 is free"
sleep 1

# ── Build Backend (only if JAR is missing or source changed) ──────────────
JAR="$BACKEND_DIR/target/uam-backend-1.0.0.jar"
if [ ! -f "$JAR" ]; then
  echo -e "${YELLOW}▶ Building backend (first run)...${NC}"
  cd "$BACKEND_DIR" && mvn package -DskipTests -q
  echo -e "${GREEN}  ✅ Backend built successfully${NC}"
else
  echo -e "${GREEN}  ✅ Backend JAR found — skipping build${NC}"
fi

# ── Start Backend ──────────────────────────────────────────────────────────
echo -e "${YELLOW}▶ Starting Spring Boot backend on :8080...${NC}"
cd "$BACKEND_DIR"
nohup java -jar "$JAR" > "$LOG_DIR/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$LOG_DIR/backend.pid"

# Wait for backend to be ready
echo -n "  Waiting for backend"
for i in {1..30}; do
  if curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo ""
    echo -e "${GREEN}  ✅ Backend ready on http://localhost:8080 (PID: $BACKEND_PID)${NC}"
    break
  fi
  echo -n "."
  sleep 1
done

# ── Install Frontend Dependencies (only if node_modules missing) ───────────
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  echo -e "${YELLOW}▶ Installing frontend dependencies (first run)...${NC}"
  cd "$FRONTEND_DIR" && npm install --silent
  echo -e "${GREEN}  ✅ Dependencies installed${NC}"
fi

# ── Start Frontend ─────────────────────────────────────────────────────────
echo -e "${YELLOW}▶ Starting React frontend on :5173...${NC}"
cd "$FRONTEND_DIR"
nohup npm run dev -- --port 5173 --host > "$LOG_DIR/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$LOG_DIR/frontend.pid"
sleep 3

echo -e "${GREEN}  ✅ Frontend ready on http://localhost:5173 (PID: $FRONTEND_PID)${NC}"

# ── Summary ────────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  ✅  All services running!                           ║${NC}"
echo -e "${CYAN}╠══════════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║  🖥️  Frontend   →  http://localhost:5173             ║${NC}"
echo -e "${CYAN}║  🔧  Backend    →  http://localhost:8080             ║${NC}"
echo -e "${CYAN}║  📖  Swagger    →  http://localhost:8080/swagger-ui.html ║${NC}"
echo -e "${CYAN}║  ❤️  Health     →  http://localhost:8080/health      ║${NC}"
echo -e "${CYAN}╠══════════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║  👤  Login: admin / Admin@123                        ║${NC}"
echo -e "${CYAN}╠══════════════════════════════════════════════════════╣${NC}"
echo -e "${CYAN}║  📄  Logs:  ./logs/backend.log                       ║${NC}"
echo -e "${CYAN}║            ./logs/frontend.log                       ║${NC}"
echo -e "${CYAN}║  🛑  Stop:  ./stop.sh                                ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
