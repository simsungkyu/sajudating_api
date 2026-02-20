#!/usr/bin/env bash
# Infinite loop: pick one seed JSON from docs/saju/itemNcard/seed, register via y2sl-local MCP (if uid duplicate, modify uid and re-register), then delete; stop when .stop_reg_seed exists (then delete it).

set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCS_SAJU="${ROOT}/docs/saju/itemNcard"
SEED_DIR="${DOCS_SAJU}/seed"
STOP_FILE="${ROOT}/.stop_reg_seed"

# Interval between cycles in seconds (0 = no sleep).
INTERVAL=10

if [[ ! -d "$SEED_DIR" ]]; then
  echo "Seed dir not found: $SEED_DIR" >&2
  exit 1
fi
cd "$ROOT"
mkdir -p "${ROOT}/logs"

# Pick one seed JSON (first matching *.json). Exclude hidden files and non-JSON.
pick_one_seed() {
  local f
  for f in "$SEED_DIR"/*.json; do
    [[ -f "$f" ]] || continue
    echo "$f"
    return 0
  done
  return 1
}

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
  local seed_path ts ts_fname logfile prompt
  seed_path="$(pick_one_seed)" || true
  if [[ -z "$seed_path" ]]; then
    echo "[$(date '+%Y-%m-%dT%H:%M:%S')] No seed JSON found in ${SEED_DIR}. Skipping cycle."
    return 0
  fi
  ts="$(date '+%Y-%m-%dT%H:%M:%S')"
  ts_fname="$(date '+%Y-%m-%dT%H%M%S')"
  logfile="${ROOT}/logs/reg_seed_agent_${ts_fname}.log"
  echo "[${ts}] Registering one seed: ${seed_path}. Log: ${logfile}"

  prompt="The selected seed file for this cycle is: ${seed_path}. Using the y2sl-local MCP server: (1) Read the file at that path and get its full JSON content. (2) Call the register_card tool with card_json set to that JSON string. (3) If registration succeeded (ok:true or uid in the response), delete the seed file at ${seed_path}. (4) If registration failed because the key (uid) already exists, modify the uid in the JSON so it is unique (e.g. append a suffix or generate a new uid), call register_card again with the modified card_json, then delete the seed file at ${seed_path}. Do only this in one cycle; run from repo root."

  run_agent "$prompt" "$logfile" || true
}

echo "runLoopRegisterSeedWithMcp: one seed JSON per cycle (register via y2sl-local MCP; if uid duplicate, modify uid and re-register, then delete). Interval=${INTERVAL}s."
echo "Graceful exit: touch .stop_reg_seed in repo root (checked before each cycle)."
while true; do
  if [[ -f "$STOP_FILE" ]]; then
    echo "[$(date '+%Y-%m-%dT%H:%M:%S')] .stop_reg_seed found. Removing .stop_reg_seed and exiting before next cycle."
    rm -f "$STOP_FILE"
    exit 0
  fi
  run_cycle
  if [[ -n "$INTERVAL" ]] && [[ "$INTERVAL" -gt 0 ]]; then
    echo "Sleeping ${INTERVAL}s..."
    sleep "$INTERVAL"
  fi
done
