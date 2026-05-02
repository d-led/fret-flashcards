#!/usr/bin/env bash
set -euo pipefail

# Run rhysd/actionlint on GitHub Actions workflows. The tool is distributed as
# Go-built release binaries (not npm). Uses $ACTIONLINT if set, otherwise
# `actionlint` on PATH (e.g. brew install actionlint), otherwise downloads a
# pinned version into .cache/actionlint/ (see ACTIONLINT_VERSION).

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

ACTIONLINT_VERSION="${ACTIONLINT_VERSION:-1.7.12}"
CACHE_DIR="${REPO_ROOT}/.cache/actionlint"
CACHED_BIN="${CACHE_DIR}/actionlint"
VERSION_FILE="${CACHE_DIR}/version.txt"

resolve_bin() {
  if [[ -n "${ACTIONLINT:-}" ]]; then
    printf '%s\n' "${ACTIONLINT}"
    return
  fi
  if command -v actionlint >/dev/null 2>&1; then
    printf '%s\n' "$(command -v actionlint)"
    return
  fi
  mkdir -p "${CACHE_DIR}"
  if [[ -x "${CACHED_BIN}" && -f "${VERSION_FILE}" && "$(cat "${VERSION_FILE}")" == "${ACTIONLINT_VERSION}" ]]; then
    printf '%s\n' "${CACHED_BIN}"
    return
  fi

  echo "actionlint: downloading v${ACTIONLINT_VERSION} to ${CACHE_DIR} (override with ACTIONLINT or install from https://github.com/rhysd/actionlint )" >&2
  local tmp dl
  tmp="$(mktemp -d)"
  dl="${tmp}/download-actionlint.bash"
  curl -fsSL "https://raw.githubusercontent.com/rhysd/actionlint/v${ACTIONLINT_VERSION}/scripts/download-actionlint.bash" -o "${dl}"
  # download-actionlint.bash logs to stdout; keep stdout clean for $(resolve_bin).
  bash "${dl}" "${ACTIONLINT_VERSION}" "${CACHE_DIR}" >&2
  rm -rf "${tmp}"
  printf '%s\n' "${ACTIONLINT_VERSION}" >"${VERSION_FILE}"
  printf '%s\n' "${CACHED_BIN}"
}

BIN="$(resolve_bin)"
exec "${BIN}" "$@"
