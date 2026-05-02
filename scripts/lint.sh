#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'

# 1) Project ESLint (eslint.config.mjs at repo root).
# 2) Stylelint (stylelint.config.mjs; first-party *.css / *.scss).
# 3) ShellCheck (scripts/*.sh).
# 4) Refactor / maintainability ESLint pass (complexity, depth, size, async hygiene):
#    scripts/eslint.refactor-metrics.mjs + scripts/eslint.refactor-metrics.rules.json
#
# Environment (refactor pass only):
#   ESLINT_REFACTOR_METRICS_ONLY   comma-separated rule ids from the rules JSON
#   REFACTOR_METRICS_FORMAT=json   JSON on stdout for the second pass
#   REFACTOR_METRICS_JSON=path     write JSON report for the second pass

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$REPO_ROOT"

CONFIG_ABS="${REPO_ROOT}/scripts/eslint.refactor-metrics.mjs"
ESLINT_BIN="${REPO_ROOT}/node_modules/.bin/eslint"
if [[ ! -x "${ESLINT_BIN}" ]]; then
  echo "Missing ${ESLINT_BIN}. Install dependencies: npm ci" >&2
  exit 1
fi

echo "== ESLint (project) ==" >&2
"${ESLINT_BIN}" .

echo "== Stylelint ==" >&2
bash "${REPO_ROOT}/scripts/stylelint.sh"

echo "== ShellCheck (scripts/) ==" >&2
bash "${REPO_ROOT}/scripts/shellcheck.sh"

echo "== ESLint (refactor metrics) ==" >&2
eslint_cmd=("${ESLINT_BIN}" --no-config-lookup -c "${CONFIG_ABS}" --max-warnings 0 .)

if [[ "${REFACTOR_METRICS_FORMAT:-}" == "json" ]]; then
  eslint_cmd+=(-f json)
  if [[ -n "${REFACTOR_METRICS_JSON:-}" ]]; then
    echo "Use either REFACTOR_METRICS_FORMAT=json or REFACTOR_METRICS_JSON=path, not both." >&2
    exit 2
  fi
elif [[ -n "${REFACTOR_METRICS_JSON:-}" ]]; then
  eslint_cmd+=(-f json -o "${REFACTOR_METRICS_JSON}")
  mkdir -p "$(dirname "${REFACTOR_METRICS_JSON}")"
fi

run_refactor() {
  "${eslint_cmd[@]}"
}

run_refactor
