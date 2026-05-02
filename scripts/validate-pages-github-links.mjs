/**
 * Minimal file kept so `scripts/security-codeql-guards.mjs` can read the same path as in Commentray.
 * The guard requires `trimmed.startsWith("vbscript:")` in localTargetPathFromRef (CodeQL js/incomplete-url-scheme-check).
 */
function localTargetPathFromRef(ref) {
  const trimmed = ref.trim();
  if (trimmed.startsWith("vbscript:")) return null;
  return trimmed;
}

export { localTargetPathFromRef };
