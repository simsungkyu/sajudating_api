#!/usr/bin/env bash
# Launch admweb and api dev in a tmux 2x2 split (4 panes). Ctrl+C keeps each pane open.

set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SESSION="${SESSION:-y2sl-local}"

if tmux has-session -t "$SESSION" 2>/dev/null; then
  echo "Session '$SESSION' already exists. Attaching."
  exec tmux attach-session -t "$SESSION"
fi

# Pane 0: admweb – npm run dev
tmux new-session -d -s "$SESSION" -c "$ROOT/admweb"
tmux send-keys -t "$SESSION" "npm run dev" Enter
tmux rename-window -t "$SESSION" dev

# Pane 1: admweb – npm run gqlgenw (split creates new pane; send-keys goes to it)
tmux split-window -h -t "$SESSION" -c "$ROOT/admweb"
tmux send-keys -t "$SESSION" "npm run gqlgenw" Enter

# Pane 2: api – make dev (split pane 0 vertically; new pane gets keys)
tmux select-pane -t "$SESSION:0.0"
tmux split-window -v -t "$SESSION" -c "$ROOT/api"
tmux send-keys -t "$SESSION" "make dev" Enter

# Pane 3: api – make gqlgen-watch (split pane 1 vertically; new pane gets keys)
tmux select-pane -t "$SESSION:0.1"
tmux split-window -v -t "$SESSION" -c "$ROOT/api"
tmux send-keys -t "$SESSION" "make gqlgen-watch" Enter

tmux select-layout -t "$SESSION" tiled
exec tmux attach-session -t "$SESSION"
