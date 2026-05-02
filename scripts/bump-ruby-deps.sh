#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

if [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]]; then
  echo "Usage: bash scripts/bump-ruby-deps.sh"
  echo ""
  echo "Updates all gems in Gemfile.lock to the latest versions allowed by Gemfile"
  echo "using Bundler."
  exit 0
fi

if ! command -v bundle >/dev/null 2>&1; then
  echo "Missing: bundle" >&2
  echo "Install Bundler first, then re-run this script." >&2
  exit 1
fi

echo "Updating Ruby dependencies with Bundler..."
bundle update --all

echo "Ruby dependency bump complete."