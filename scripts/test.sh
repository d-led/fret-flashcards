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

mode="${COMMENTRAY_TEST_MODE:-unit}"
case "$mode" in
  # Unit Vitest suite includes `packages/architecture/architecture.test.ts`
  # (ArchUnitTS rules vs `tsconfig.archunit.json`).
  unit) exec npm run test:unit ;;
  integration) exec npm run test:integration ;;
  expensive) exec npm run test:expensive ;;
  all)
    npm run test:unit && npm run test:integration && npm run test:expensive
    ;;
  *) echo "Unknown COMMENTRAY_TEST_MODE=$mode (use unit|integration|expensive|all)" >&2; exit 1 ;;
esac
