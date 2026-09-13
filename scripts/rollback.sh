#!/usr/bin/env bash
set -euo pipefail

# Emergency rollback helper for buildmysite.
#
# Usage:
#   ./scripts/rollback.sh <commit-sha>     Revert a specific bad commit
#   ./scripts/rollback.sh --last-good      Reset to the previous commit (DANGEROUS)
#
# After pushing, GitHub Actions will redeploy the site automatically.

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

if [[ $# -lt 1 ]]; then
  echo "Usage:"
  echo "  $0 <commit-sha>       Revert the given commit on main"
  echo "  $0 --last-good        Hard reset main to HEAD~1 and force-push"
  echo ""
  echo "Recent commits:"
  git log --oneline -10
  exit 1
fi

TARGET="$1"

if [[ "$TARGET" == "--last-good" ]]; then
  echo "WARNING: This will hard-reset main to HEAD~1 and force-push."
  echo "Press Ctrl+C to cancel, or Enter to continue."
  read -r
  git reset --hard HEAD~1
  git push --force-with-lease origin main
  echo "Done. main reset to $(git rev-parse --short HEAD)."
  exit 0
fi

echo "Reverting commit $TARGET…"
git revert --no-edit "$TARGET"
git push origin main
echo "Done. Revert pushed; site will redeploy shortly."
