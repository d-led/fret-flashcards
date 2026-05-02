#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Vitest workers often have a non-TTY stderr; default FORCE_COLOR so CLI warnings stay
# highlighted in test and quality-gate output (NO_COLOR and FORCE_COLOR=0 still win).
: "${FORCE_COLOR:=1}"
export FORCE_COLOR

# Avoid VS Code auto-attach side effects in child Node processes.
unset VSCODE_INSPECTOR_OPTIONS

mode="${FRET_TEST_MODE:-${COMMENTRAY_TEST_MODE:-unit}}"
case "$mode" in
  unit) exec npm test ;;
  integration|expensive)
    echo "No ${mode} suite in this repo; running unit tests (npm test)." >&2
    exec npm test
    ;;
  all) exec npm run test:all ;;
  *) echo "Unknown FRET_TEST_MODE/COMMENTRAY_TEST_MODE=$mode (use unit|integration|expensive|all)" >&2; exit 1 ;;
esac
