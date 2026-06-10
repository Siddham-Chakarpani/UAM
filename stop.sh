#!/bin/bash
# =============================================================================
#  UAM — Stop All Services
#  Usage: ./stop.sh
# =============================================================================

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_DIR="$ROOT_DIR/logs"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

echo ""
echo -e "${YELLOW}▶ Stopping UAM services...${NC}"

# ── Stop via saved PID files ───────────────────────────────────────────────
for SERVICE in backend frontend; do
  PID_FILE="$LOG_DIR/${SERVICE}.pid"
  if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")
    if kill -0 "$PID" 2>/dev/null; then
      kill "$PID" && echo -e "${GREEN}  ✅ Stopped $SERVICE (PID: $PID)${NC}"
    else
      echo -e "  ℹ️  $SERVICE was not running (PID: $PID stale)"
    fi
    rm -f "$PID_FILE"
  fi
done

# ── Fallback: kill by port ─────────────────────────────────────────────────
lsof -ti:8080 | xargs kill -9 2>/dev/null && echo -e "${GREEN}  ✅ Cleared port 8080${NC}" || true
lsof -ti:5173 | xargs kill -9 2>/dev/null && echo -e "${GREEN}  ✅ Cleared port 5173${NC}" || true

echo ""
echo -e "${CYAN}All UAM services stopped.${NC}"
echo ""
