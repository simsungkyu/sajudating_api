#!/usr/bin/env bash
# One-liner to run SajuAssemble(itemNcard) verification and output a markdown snippet for Verification.md 검증 이력 table.
# Usage: from repo root, ./docs/SajuAssemble/run_verification.sh
# Or: bash docs/SajuAssemble/run_verification.sh

set -e
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT/api"

echo "Running: make test-itemncard"
make test-itemncard
TEST_EXIT=$?

echo ""
echo "Running: go build ."
go build .
BUILD_EXIT=$?

DATE=$(date +%Y-%m-%d)
if [ "$TEST_EXIT" -eq 0 ] && [ "$BUILD_EXIT" -eq 0 ]; then
  RESULT="통과"
else
  RESULT="미통과"
fi

echo ""
echo "--- Paste into Verification.md 검증 이력 table ---"
echo "| $DATE | (검증자) | $RESULT | make test-itemncard + go build |"
echo "---"
