#!/usr/bin/env bash
set -euo pipefail

# Full quality gate: the set of checks that must pass before a change is
# considered done. Runs:
#   - prettier format check
#   - actionlint (GitHub Actions workflows; Go binary, see scripts/actionlint.sh)
#   - ESLint (project + refactor metrics) and Stylelint (first-party CSS)
#   - duplicate detection (jscpd)
#   - tsc -b across the monorepo
#   - commentray validate (full workspace — same checks as the pre-commit hook,
#     but not --staged, so any index/companion/orphan inconsistency fails CI)
#   - unit tests (includes ArchUnitTS rules under packages/architecture/ vs
#     tsconfig.archunit.json — see .commentray/source/README.md/architecture.md)
#   - static pages build + link-shape validation (`npm run pages:build` + `npm run pages:validate`,
#     including humane browse redirect targets + `_site/serve.json` for local static parity)
#
# Stops at the first failing step and prints which step failed (see messages
# above the failing tool output — e.g. format:check names the first drifted file).
#
# Slow-lane checks (integration, expensive tests, binary smoke) live in
# scripts/ci-full.sh, which is this gate plus those extras.
#
# Parity with GitHub Actions: `.github/workflows/ci.yml` job `quick` runs this
# script, then a **separate** step `npm run test:integration` — so a full local
# mirror of that job is: `bash scripts/quality-gate.sh && npm run test:integration`.
#
# Prerequisites (tools not vendored via npm) are verified up front — see
# quality_gate_require_external_tools.

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

# Prettier / ESLint / Vitest often suppress color without a TTY (e.g. Cursor task
# output). Same default as scripts/test.sh; `NO_COLOR` or `FORCE_COLOR=0` wins.
: "${FORCE_COLOR:=1}"
export FORCE_COLOR

# Keep local quality-gate behavior deterministic when launched from a VS Code
# JavaScript Debug Terminal (auto-attach signal for child Node processes).
unset VSCODE_INSPECTOR_OPTIONS

quality_gate_require_external_tools() {
  local failed=0
  local al_version="${ACTIONLINT_VERSION:-1.7.12}"

  if [[ ! -d "${REPO_ROOT}/node_modules" ]]; then
    echo "" >&2
    echo "Missing npm dependencies (there is no node_modules/ directory)." >&2
    echo "  Install:" >&2
    echo "    cd \"${REPO_ROOT}\" && npm ci" >&2
    failed=1
  fi

  if ! command -v node >/dev/null 2>&1; then
    echo "" >&2
    echo "Missing: node (Node.js 20+ is required; see package.json engines)." >&2
    echo "  Install: https://nodejs.org/  or use nvm / fnm / your OS package manager." >&2
    failed=1
  fi

  if ! command -v npm >/dev/null 2>&1; then
    echo "" >&2
    echo "Missing: npm (comes with a normal Node.js install)." >&2
    failed=1
  fi

  if ! command -v shellcheck >/dev/null 2>&1; then
    echo "" >&2
    echo "Missing: shellcheck (required for npm run lint → scripts/shellcheck.sh)." >&2
    echo "  macOS:   brew install shellcheck" >&2
    echo "  Debian:  sudo apt install shellcheck" >&2
    echo "  Fedora:  sudo dnf install ShellCheck" >&2
    echo "  More:    https://github.com/koalaman/shellcheck#installing" >&2
    failed=1
  fi

  local have_actionlint=0
  if [[ -n "${ACTIONLINT:-}" ]]; then
    if [[ -x "${ACTIONLINT}" ]] || command -v "${ACTIONLINT}" >/dev/null 2>&1; then
      have_actionlint=1
    fi
  elif command -v actionlint >/dev/null 2>&1; then
    have_actionlint=1
  elif [[ -x "${REPO_ROOT}/.cache/actionlint/actionlint" && -f "${REPO_ROOT}/.cache/actionlint/version.txt" && "$(cat "${REPO_ROOT}/.cache/actionlint/version.txt")" == "${al_version}" ]]; then
    have_actionlint=1
  fi

  if [[ "${have_actionlint}" -eq 0 ]] && ! command -v curl >/dev/null 2>&1; then
    echo "" >&2
    echo "Missing: curl, and no actionlint binary available yet." >&2
    echo "  scripts/actionlint.sh downloads a pinned release when actionlint is not on PATH;" >&2
    echo "  that requires curl, or install actionlint yourself:" >&2
    echo "    macOS:  brew install actionlint" >&2
    echo "    Or set:  export ACTIONLINT=/path/to/actionlint" >&2
    echo "    Upstream: https://github.com/rhysd/actionlint" >&2
    failed=1
  fi

  if [[ "${failed}" -ne 0 ]]; then
    echo "" >&2
    echo "Fix the prerequisites above, then re-run:" >&2
    echo "  bash scripts/quality-gate.sh" >&2
    exit 1
  fi
}

quality_gate_require_external_tools

run_step() {
  local name="$1"
  shift
  echo "" >&2
  echo "---- quality-gate: ${name} ----" >&2
  if ! "$@"; then
    echo "" >&2
    echo "QUALITY GATE FAILED at: ${name}" >&2
    echo "Fix the issue above, then re-run: bash scripts/quality-gate.sh" >&2
    exit 1
  fi
}

run_step "format:check" npm run format:check
run_step "actionlint" bash scripts/actionlint.sh
run_step "lint" npm run lint
run_step "dupes" npm run dupes
run_step "security:codeql-guards" npm run security:codeql-guards
run_step "typecheck" npm run typecheck
run_step "build" npm run build
run_step "test (unit)" npm run test
run_step "accessibility" npm run test:accessibility

echo "" >&2
echo "Quality gate passed." >&2
