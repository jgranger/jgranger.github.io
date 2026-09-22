#!/usr/bin/env bash
#
# Keeps the private book content repo (docs/private -> agentic-journey-content)
# synchronised between this machine and whatever edits it remotely, then asks
# Render to rebuild so new writing actually reaches the site.
#
# Written after a 49-commit divergence: local edits sat uncommitted for a day
# while the remote moved on, and nothing was pushing. The rules below all come
# from that failure, so change them deliberately:
#
#   * Push EVERY cycle. A pull-only loop silently strands local work forever.
#   * Never resolve a conflict automatically. On a failed rebase, abort, leave
#     the tree exactly as it was, notify, and exit non-zero. A daemon guessing
#     at prose conflicts is how writing gets destroyed.
#   * Never act mid-edit. Skip the cycle if a merge/rebase is already in
#     progress (a human is resolving) or if a file changed in the last 30
#     seconds (an editor is mid-save).
#   * One at a time. flock, so a slow cycle can't overlap the next.
#
# Exit codes: 0 did something or nothing, cleanly. 1 needs a human.

set -uo pipefail

# --pull-only: fast-forward from the remote and nothing else. Used for the
# website repo, where auto-committing would be wrong — a writing checkpoint is
# always safe to commit, half-finished code is not. That mode never commits,
# never pushes and skips entirely if the tree is dirty.
PULL_ONLY=false
[ "${1:-}" = "--pull-only" ] && PULL_ONLY=true

REPO="${AGENTIC_CONTENT_REPO:-/home/jon/Documents/projects/personal/agentic-journey/docs/private}"
HOOK_FILE="${AGENTIC_RENDER_HOOK:-$HOME/.config/agentic-journey/render-hook}"
LOCK="/tmp/agentic-journey-sync-$(echo "${AGENTIC_CONTENT_REPO:-content}" | md5sum | cut -c1-8).lock"
QUIET_SECONDS=30
BRANCH=main

log() { printf '%s  %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*"; }

notify() {
  command -v notify-send >/dev/null 2>&1 && \
    notify-send -u critical "Book sync needs you" "$1" 2>/dev/null
  log "NEEDS HUMAN: $1"
}

# Serialise cycles. Exiting quietly is correct — the next tick will pick it up.
exec 9>"$LOCK"
flock -n 9 || { log "another cycle is running, skipping"; exit 0; }

cd "$REPO" || { log "repo not found at $REPO"; exit 1; }

# A human resolving a conflict must never have the ground moved under them.
if [ -e .git/MERGE_HEAD ] || [ -d .git/rebase-merge ] || [ -d .git/rebase-apply ]; then
  log "merge or rebase in progress, leaving it alone"
  exit 0
fi

# Don't snapshot a file mid-save. Obsidian and friends write in stages.
if [ -n "$(find . -path ./.git -prune -o -type f -newermt "-${QUIET_SECONDS} seconds" -print -quit)" ]; then
  log "a file changed in the last ${QUIET_SECONDS}s, waiting for the writer to settle"
  exit 0
fi

committed=false
if [ "$PULL_ONLY" = true ]; then
  if [ -n "$(git status --porcelain)" ]; then
    log "local changes present, not touching them (pull-only mode)"
    exit 0
  fi
elif [ -n "$(git status --porcelain)" ]; then
  git add -A
  if git commit -q -m "Writing checkpoint $(date '+%Y-%m-%d %H:%M')"; then
    committed=true
    log "committed local changes"
  fi
fi

if ! git fetch -q origin "$BRANCH"; then
  log "fetch failed (offline?), will retry next cycle"
  exit 0
fi

local_head=$(git rev-parse HEAD)
remote_head=$(git rev-parse "origin/$BRANCH")
base=$(git merge-base HEAD "origin/$BRANCH")

if [ "$local_head" = "$remote_head" ]; then
  log "already in sync"
  exit 0
fi

# Rebase rather than merge, so local writing lands on top of remote work and
# the history stays readable. --autostash is deliberately NOT used: we already
# committed everything above, so a dirty tree here means something unexpected.
if [ "$PULL_ONLY" = true ] && [ "$base" != "$remote_head" ]; then
  # Fast-forward only. Never rewrite local commits in a repo the daemon
  # doesn't own; if the branches have genuinely diverged, that's a human's
  # call, so say so and leave everything alone.
  if ! git merge --ff-only -q "origin/$BRANCH" 2>/dev/null; then
    log "local and origin/$BRANCH have diverged, leaving it to you"
    exit 0
  fi
elif [ "$base" != "$remote_head" ]; then
  if ! git rebase -q "origin/$BRANCH" 2>/dev/null; then
    git rebase --abort 2>/dev/null
    notify "Local and remote book edits conflict. Nothing was changed or lost. Resolve by hand in docs/private."
    exit 1
  fi
  log "rebased onto origin/$BRANCH"
fi

# Did this cycle bring down work written elsewhere? That needs a deploy just
# as much as local writing does, otherwise remote edits sit in GitHub unseen.
pulled=false
[ "$(git rev-parse HEAD)" != "$local_head" ] && pulled=true

# The whole point. A cycle that pulls but never pushes is the bug this
# script exists to prevent.
if [ "$PULL_ONLY" = true ]; then
  if [ "$pulled" = true ]; then
    log "fast-forwarded to origin/$BRANCH"
  fi
  # Local commits in pull-only mode are a human's business, not a daemon's.
  if [ -n "$(git log "origin/$BRANCH..HEAD" --oneline)" ]; then
    log "local commits not pushed (pull-only mode) — push them yourself"
  fi
  exit 0
fi

if [ -n "$(git log "origin/$BRANCH..HEAD" --oneline)" ]; then
  if ! git push -q origin "$BRANCH"; then
    notify "Could not push book changes to GitHub. Your commits are safe locally."
    exit 1
  fi
  log "pushed to origin/$BRANCH"
  pushed=true
else
  pushed=false
fi

# Render only rebuilds on pushes to the website repo, never on content pushes,
# so new writing would otherwise sit in GitHub and never reach the site.
if [ "$pushed" = true ] || [ "$committed" = true ] || [ "$pulled" = true ]; then
  if [ -r "$HOOK_FILE" ]; then
    if curl -fsS -X POST "$(cat "$HOOK_FILE")" -o /dev/null; then
      log "triggered Render deploy"
    else
      log "Render deploy hook failed (site will be stale until the next deploy)"
    fi
  else
    log "no deploy hook at $HOOK_FILE, skipping site rebuild"
  fi
fi

log "cycle complete"
