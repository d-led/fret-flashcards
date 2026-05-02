import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  {
    ignores: [
      "**/dist/**",
      "**/out/**",
      "**/.approval_tests_temp/**",
      "coverage/**",
      "**/*.mjs",
      "eslint.config.mjs",
      "packages/vscode/fixtures/**",
      /** Downloaded VS Code app for @vscode/test-* (contains nested tsconfigs that confuse the parser). */
      "**/.vscode-test/**",
      /** Cypress JS specs + Node CJS scripts (this repo); Commentray’s gate targets TS-first scripts. */
      "cypress/**/*.js",
      "scripts/**/*.js",
      /** Capacitor / Xcode synced web assets (generated or copied bundles). */
      "ios/**",
    ],
  },
  {
    files: ["cypress/**/*.ts", "cypress.config.ts"],
    languageOptions: {
      globals: {
        afterEach: "readonly",
        beforeEach: "readonly",
        cy: "readonly",
        Cypress: "readonly",
        describe: "readonly",
        expect: "readonly",
        it: "readonly",
      },
    },
  },
  {
    files: ["cypress/support/custom-commands/chainable.ts"],
    rules: {
      /** Cypress `Chainable` augmentation uses `declare global { namespace Cypress { … } }`. */
      "@typescript-eslint/no-namespace": "off",
    },
  },
  {
    files: ["packages/cli/src/**/*.ts", "packages/code-commentray-static/src/**/*.ts"],
    rules: {
      "no-console": "off",
    },
  },
  {
    files: ["cypress.config.ts"],
    languageOptions: {
      globals: {
        __dirname: "readonly",
        console: "readonly",
        process: "readonly",
      },
    },
    rules: {
      "no-console": "off",
    },
  },
  {
    files: ["src/ts/modules/**/*.ts", "src/ts/types/**/*.ts", "**/*.d.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  /** Node CommonJS scripts (`require`, `__dirname`) — keep `require` and Node globals allowed. */
  {
    files: ["scripts/**/*.cjs"],
    languageOptions: {
      globals: {
        __dirname: "readonly",
        __filename: "readonly",
        Buffer: "readonly",
        console: "readonly",
        exports: "readonly",
        module: "readonly",
        process: "readonly",
        require: "readonly",
      },
      sourceType: "script",
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    rules: {
      "@typescript-eslint/consistent-type-imports": ["error", { fixStyle: "inline-type-imports" }],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
);
