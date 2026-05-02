#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

# Shellcheck for every first-party shell script under scripts/.
#
# `-x` follows sourced files; `-P SCRIPTDIR` resolves them relative to each
# script's own directory (needed for scripts that `source lib/...`).
#
# Fails on any default-severity finding. If shellcheck is not on PATH the
# script skips (emits a note) so contributors without it installed are not
# blocked locally — CI has it and gates on it.

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

if ! command -v shellcheck >/dev/null 2>&1; then
  echo "note: shellcheck not found on PATH; skipping. Install via 'brew install shellcheck' or your package manager." >&2
  exit 0
fi

# bash 3.2 (still the default on macOS) lacks globstar and mapfile. Use
# `find -exec ... +`: batches like xargs, no-ops cleanly when no scripts
# match, and is portable between BSD and GNU findutils.
exec find scripts -type f -name "*.sh" -exec shellcheck -x -P SCRIPTDIR {} +
