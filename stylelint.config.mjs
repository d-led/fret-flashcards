/** @type {import("stylelint").Config} */
export default {
  extends: ["stylelint-config-standard"],
  ignoreFiles: [
    "**/node_modules/**",
    "**/dist/**",
    "**/out/**",
    "coverage/**",
    /** Vitest / tooling HTML coverage reports (third-party layout CSS). */
    "test-results/**",
    /** Capacitor sync output; source of truth is `src/css/`. */
    "ios/**",
    "**/.vscode-test/**",
    "**/.cache/**",
    /** Generated-adjacent shell bundle: BEM + density rules predate strict standard config. */
    "packages/render/src/code-browser-shell.css",
  ],
  rules: {
    /** System UI colors (`Canvas`, `CanvasText`) are valid in modern CSS. */
    "value-keyword-case": null,
  },
};
