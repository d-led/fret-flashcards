/**
 * Minimal file kept so `scripts/security-codeql-guards.mjs` can read the same paths as in Commentray.
 * Do not reintroduce trailing-slash trimming with a non-linear regex on slashes (CodeQL js/polynomial-redos).
 */
export function trimTrailingSlashes(input: string): string {
  let out = input;
  while (out.endsWith("/")) {
    out = out.slice(0, -1);
  }
  return out;
}
