#!/usr/bin/env bash
# Headless cursor agent loop for docs/saju/itemNcard: two-phase (create task plan, then execute).
# Optional: run API with LOCAL_MCP=true and use y2sl-local MCP tools (register_card, update_card, list_cards)
# to register/update/list data cards. Card JSON: pass seed file contents from docs/saju/itemNcard/seed/ or
# agent-generated JSON (CardDataStructure/ChemiStructure). Step-by-step MCP procedure: see
# docs/saju/itemNcard/OperatorGuide.md §MCP 연동 · runLoopForSaju에서 MCP 사용 절차 (and PRD §4).

set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCS_SAJU="${ROOT}/docs/saju/itemNcard"
TASKS_DIR="${DOCS_SAJU}/tasks"
PRD="${DOCS_SAJU}/PRD.md"
LOOP_ENV="${ROOT}/setLoopEnvForSaju.sh"

# Load prompt/env once at start (and again at start of each run_cycle for live edits).
if [[ -f "$LOOP_ENV" ]]; then
  # shellcheck source=./setLoopEnvForSaju.sh
  source "$LOOP_ENV"
else
  echo "Error: ${LOOP_ENV} not found. Create it from setLoopEnvForSaju.sh (EXECUTE_PROMPT, PHASE1_PROMPT_BODY, INTERVAL)." >&2
  exit 1
fi

# Graceful exit: create this file (e.g. touch logs/.stop) from another terminal; current cycle will finish then exit (agent is not interrupted).
STOP_FILE="${ROOT}/logs/.stop"

if [[ ! -f "$PRD" ]]; then
  echo "PRD not found: $PRD"
  exit 1
fi

cd "$ROOT"
mkdir -p logs
mkdir -p "$TASKS_DIR"

run_agent() {
  local prompt="$1"
  local logfile="$2"
  local ex start_sec end_sec elapsed
  start_sec=$(date +%s)
  {
    echo "=== INPUT (prompt) ==="
    echo "$prompt"
    echo ""
    echo "=== OUTPUT ==="
  } | tee -a "$logfile"
  cursor agent -p --force --output-format text "$prompt" 2>&1 | tee -a "$logfile"
  ex="${PIPESTATUS[0]}"
  end_sec=$(date +%s)
  elapsed=$(( end_sec - start_sec ))
  echo "[$(date '+%Y-%m-%dT%H:%M:%S')] Duration: ${elapsed}s (exit ${ex})" | tee -a "$logfile"
  return "$ex"
}

run_cycle() {
  # Reload prompt/env each cycle so edits to setLoopEnvForSaju.sh apply without restart.
  if [[ -f "$LOOP_ENV" ]]; then
    # shellcheck source=./setLoopEnvForSaju.sh
    source "$LOOP_ENV"
  else
    echo "Warning: ${LOOP_ENV} not found; EXECUTE_PROMPT/PHASE1_PROMPT_BODY/INTERVAL may be unset." >&2
  fi

  local ts ts_fname logfile taskfile cycle_start_sec cycle_end_sec cycle_elapsed
  ts="$(date '+%Y-%m-%dT%H:%M:%S')"
  ts_fname="$(date '+%Y-%m-%dT%H%M%S')"
  logfile="${ROOT}/logs/agent_${ts_fname}.log"
  taskfile="${TASKS_DIR}/task_${ts_fname}.md"
  cycle_start_sec=$(date +%s)

  echo "[${ts}] Starting two-phase cycle. Log: ${logfile} | Task plan: ${taskfile}"

  # Phase 1: create task plan file (creation-time-based path)
  echo "[$(date '+%Y-%m-%dT%H:%M:%S')] === PHASE 1: CREATE TASK PLAN === (${taskfile})" | tee -a "$logfile"
  run_agent "Create a single task plan file at ${taskfile}. ${PHASE1_PROMPT_BODY}" "$logfile" || true
  echo "" | tee -a "$logfile"

  # Phase 2: execute task plan
  echo "[$(date '+%Y-%m-%dT%H:%M:%S')] === PHASE 2: EXECUTE TASK PLAN === (${taskfile})" | tee -a "$logfile"
  run_agent "Task plan file path: ${taskfile}. ${EXECUTE_PROMPT}" "$logfile" || true

  cycle_end_sec=$(date +%s)
  cycle_elapsed=$(( cycle_end_sec - cycle_start_sec ))
  echo "[$(date '+%Y-%m-%dT%H:%M:%S')] Cycle total duration: ${cycle_elapsed}s" | tee -a "$logfile"
}

echo "Two-phase (plan → execute) for itemNcard. Interval=${INTERVAL}s."
echo "Graceful exit (no agent interrupt): touch logs/.stop from another terminal."
while true; do
  run_cycle
  if [[ -f "$STOP_FILE" ]]; then
    rm -f "$STOP_FILE"
    echo "Stop file detected. Removed logs/.stop. Current process stopping. Exiting."
    exit 0
  fi
  if [[ "$INTERVAL" -gt 0 ]]; then
    echo "Sleeping ${INTERVAL}s..."
    sleep "$INTERVAL"
  fi
done
