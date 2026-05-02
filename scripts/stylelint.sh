#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

# Stylelint for first-party CSS (e.g. extracted layout sheets under packages/).
# Uses --allow-empty-input so the gate still passes when no *.css/*.scss match.
#
# Config: stylelint.config.mjs at repo root.

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

BIN="${REPO_ROOT}/node_modules/.bin/stylelint"
if [[ ! -x "${BIN}" ]]; then
  echo "Missing ${BIN}. Install dependencies: npm ci" >&2
  exit 1
fi

"${BIN}" --allow-empty-input "**/*.css" "**/*.scss"
echo "Stylelint: no findings (clean)." >&2
