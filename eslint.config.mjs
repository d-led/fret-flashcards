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
      /** Capacitor iOS project: synced web bundle under App/public (not authored in-repo source). */
      "ios/**",
    ],
  },
  {
    files: ["cypress/**/*.ts", "cypress/**/*.js", "cypress.config.ts"],
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
  /** Node CommonJS scripts (`require`, `__dirname`) — keep `require` and Node globals allowed. */
  {
    files: ["scripts/**/*.cjs", "scripts/**/*.js"],
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
