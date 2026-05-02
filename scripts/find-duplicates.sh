#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

# Duplicate detection for first-party TS/JS (jscpd). Line/token based—tune -l / -k together.
# Any clone fails the script (--threshold 1) so CI stays at zero findings.

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# jscpd keeps one -i value: single comma-separated ignore list.
JSCPD_IGNORE="**/node_modules/**,**/dist/**,**/coverage/**,**/.cache/**,**/.git/**,**/.vscode-test/**,packages/code-commentray-static/site/**,*.vsix,.yarn/**"

# Console table + threshold via scripts/run-jscpd-dupes.cjs (green/yellow/red header by duplication level).
export COMMENTRAY_JSCPD_IGNORE="${JSCPD_IGNORE}"
exec node "${REPO_ROOT}/scripts/run-jscpd-dupes.cjs"
