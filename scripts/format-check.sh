#!/usr/bin/env bash
set -euo pipefail
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Stop on the first file Prettier would change (clearer for fix-in-a-loop workflows).
set +e
drift_out="$(npx prettier --list-different . 2>/dev/null)"
code=$?
set -e

if [[ "$code" -eq 0 ]]; then
  exit 0
fi

if [[ -z "${drift_out}" ]]; then
  echo "prettier --list-different exited ${code} but printed no paths; re-run: npx prettier --check ." >&2
  exit "$code"
fi

first="$(printf '%s\n' "${drift_out}" | head -n 1)"
total="$(printf '%s\n' "${drift_out}" | wc -l | tr -d '[:space:]')"

echo "Format check: first file that differs from Prettier output:" >&2
echo "  ${first}" >&2
echo "" >&2
echo "Fix (this file only), then re-run scripts/format-check.sh or npm run format:check:" >&2
echo "  npx prettier --write \"${first}\"" >&2

if [[ "${total}" -gt 1 ]]; then
  echo "" >&2
  echo "(${total} files total differ; remaining after the first:)" >&2
  printf '%s\n' "${drift_out}" | tail -n +2 | sed 's/^/  /' >&2
fi
exit 1
