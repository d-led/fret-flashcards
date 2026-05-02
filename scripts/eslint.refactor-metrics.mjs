// ESLint flat config: refactoring / maintainability (complexity, size, async hygiene).
// Loaded via: node_modules/.bin/eslint --no-config-lookup -c scripts/eslint.refactor-metrics.mjs (see scripts/lint.sh)
//
// Rule IDs for ESLINT_REFACTOR_METRICS_ONLY: keys in eslint.refactor-metrics.rules.json

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rulesPath = join(__dirname, "eslint.refactor-metrics.rules.json");

/** @type {Record<string, import("eslint").Linter.RuleEntry>} */
const DEFAULT_RULES = JSON.parse(readFileSync(rulesPath, "utf8"));

const REFACTOR_METRICS_RULE_IDS = Object.keys(DEFAULT_RULES).sort((a, b) => a.localeCompare(b));

const require = createRequire(join(process.cwd(), "package.json"));
const tseslint = require("typescript-eslint");

function rulesFromEnv() {
  const raw = process.env.ESLINT_REFACTOR_METRICS_ONLY?.trim();
  if (!raw) {
    return DEFAULT_RULES;
  }
  const only = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  /** @type {Record<string, import("eslint").Linter.RuleEntry>} */
  const picked = {};
  for (const id of only) {
    if (!Object.hasOwn(DEFAULT_RULES, id)) {
      throw new Error(`Unknown rule "${id}". Known rules: ${REFACTOR_METRICS_RULE_IDS.join(", ")}`);
    }
    picked[id] = DEFAULT_RULES[id];
  }
  return picked;
}

const rules = rulesFromEnv();

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/coverage/**",
      "**/.approval_tests_temp/**",
      "**/.vscode-test/**",
      "**/cypress/**",
      "cypress.config.ts",
      "packages/code-commentray-static/site/**",
      "packages/vscode/fixtures/**",
    ],
  },
  {
    files: ["**/*.{ts,mts,cts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: "./tsconfig.eslint.json",
        tsconfigRootDir: process.cwd(),
      },
    },
    plugins: {
      "@typescript-eslint": tseslint.plugin,
    },
    rules,
  },
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
      },
    },
    rules: filterRulesForJs(rules),
  },
);

/**
 * TypeScript-only rule keys should not run on plain JS.
 * @param {Record<string, import("eslint").Linter.RuleEntry>} all
 */
function filterRulesForJs(all) {
  /** @type {Record<string, import("eslint").Linter.RuleEntry>} */
  const out = {};
  for (const [key, value] of Object.entries(all)) {
    if (key.startsWith("@typescript-eslint/")) {
      continue;
    }
    out[key] = value;
  }
  return out;
}
