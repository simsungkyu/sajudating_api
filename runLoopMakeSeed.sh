#!/usr/bin/env bash
# Infinite loop: cursor agent creates one seed JSON per cycle; stop when seed/.stop exists (then delete .stop).
# Agent uses docs/saju/itemNcard (PRD, TokenRule, etc.) and seed/README.md.

set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCS_SAJU="${ROOT}/docs/saju/itemNcard"
SEED_DIR="${DOCS_SAJU}/seed"
STOP_FILE="${SEED_DIR}/.stop"

# Prompt: agent creates one new seed file per cycle using PRD and config.
SEED_PROMPT="Using docs/saju/itemNcard (PRD.md, CardDataStructure.md, ChemiStructure.md, TokenRule.md, TokenStructure.md, Seed.md) and docs/saju/itemNcard/seed/README.md: create exactly one new seed JSON file in docs/saju/itemNcard/seed for a case that can exist according to those docs. Rules: (1) One file per cycle. Filename format: (saju|pair)_명칭_*.json — use prefix saju_ for scope saju, pair_ for scope pair; after the second underscore, * is any characters that roughly describe the card content (개략적인 표현). (2) Do not overwrite existing files: list existing *.json in seed/ and pick a filename that does not yet exist. (3) Use the logical shape from README: trigger/score/content as objects; card_id, version, status, rule_set, scope, title, category, tags, domains, priority, cooldown_group, max_per_user, trigger (all/any/not), score (base, bonus_if, penalty_if), content (summary, points, questions, guardrails), debug. (4) Run from repo root. Create only one new file this cycle."

# Interval between cycles in seconds (0 = no sleep).
INTERVAL=10

if [[ ! -d "$SEED_DIR" ]]; then
  echo "Seed dir not found: $SEED_DIR" >&2
  exit 1
fi
cd "$ROOT"
mkdir -p "${ROOT}/logs"

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
  local ts ts_fname logfile
  ts="$(date '+%Y-%m-%dT%H:%M:%S')"
  ts_fname="$(date '+%Y-%m-%dT%H%M%S')"
  logfile="${ROOT}/logs/seed_agent_${ts_fname}.log"
  echo "[${ts}] Starting seed cycle. Log: ${logfile}"
  run_agent "$SEED_PROMPT" "$logfile" || true
}

echo "runLoopMakeSeed: one seed JSON per cycle. Interval=${INTERVAL}s."
echo "Graceful exit: touch docs/saju/itemNcard/seed/.stop (checked before each cycle)."
while true; do
  if [[ -f "$STOP_FILE" ]]; then
    echo "[$(date '+%Y-%m-%dT%H:%M:%S')] .stop found. Removing .stop and exiting before next cycle."
    rm -f "$STOP_FILE"
    exit 0
  fi
  run_cycle
  if [[ -n "$INTERVAL" ]] && [[ "$INTERVAL" -gt 0 ]]; then
    echo "Sleeping ${INTERVAL}s..."
    sleep "$INTERVAL"
  fi
done
