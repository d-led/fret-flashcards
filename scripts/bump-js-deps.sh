#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  echo "Usage: bash scripts/bump-js-deps.sh"
  echo ""
  echo "Updates JavaScript dependency ranges with Taze using the major preset"
  echo "and then refreshes package-lock.json with npm install."
  exit 0
fi

echo "Updating JavaScript dependency ranges with Taze (major preset)..."
npx --yes taze -w major

echo "Refreshing package-lock.json..."
npm install

echo "JavaScript dependency bump complete."