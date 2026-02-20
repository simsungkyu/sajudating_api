#!/usr/bin/env bash
# Loop env for runLoopForSaju.sh: EXECUTE_PROMPT, PHASE1_PROMPT_BODY, INTERVAL. Sourced each cycle to apply edits without restart.

# Phase 2 execute prompt (edit here to change execute-phase behavior). Lines wrapped at ~120 chars for readability.
EXECUTE_PROMPT="Execute the task plan in the file path given above. Implement the tasks listed there. "\
"Write test code where appropriate and run tests (e.g. cd api && go test ./...) to verify; also run API build (e.g. go build) and confirm. "\
"Then update that same task plan file with the execution result (what was done, status, remaining or next steps). "\
"If the task plan was created for an item from docs/saju/itemNcard/CheckList.md, update CheckList.md to mark that item as completed: "\
"change the corresponding line from \"- [ ]\" to \"- [x]\" (keep the rest of the line unchanged). Run from repo root. "\
"Note: the dev server (api and admweb) is always running in watch mode and auto-reloads on file changes; "\
"gqlgen for both api and admweb is also always running in watch mode. "\
"Do not run make run, npm run dev, make gqlgen, npm run gqlgen, or similar commands. "

# Phase 1 prompt body (prefixed by runLoopForSaju.sh with \"Create a single task plan file at <taskfile>. \"). Lines wrapped at ~120 chars.
PHASE1_PROMPT_BODY="Use docs/saju/itemNcard (CardDataStructure, ChemiStructure, TokenRule, TokenStructure, UserInfoStructure, ExtractionAPI, OperatorGuide, Seed, TestScope, Verification, etc.) "\
"and PRD at docs/saju/itemNcard/PRD.md. "\
"First read docs/saju/itemNcard/CheckList.md: if it lists any remaining incomplete items, choose exactly one of them and write the task plan for that item. "\
"If CheckList.md is empty or has no remaining items, choose exactly one task from the rest of the docs (all of docs/saju/itemNcard except PRD) and write the task plan for it. "\
"The task plan file must list the next concrete tasks (ordered steps) for the chosen item. "\
"Keep each task at an appropriate size (neither too large nor too small). "\
"Only create or update this task plan file; do not implement code yet. Run from repo root."

# Interval between cycles in seconds (0 = no sleep).
INTERVAL=10
