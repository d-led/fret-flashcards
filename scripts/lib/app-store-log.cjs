"use strict";

/**
 * Shared timestamped logger for App Store helper scripts (avoids jscpd clone between prep/remove).
 *
 * @param {Record<string, string>} [extraPrefixes] optional type → emoji (e.g. `{ rocket: "🚀" }`)
 * @returns {(message: string, type?: string) => void}
 */
function createAppStoreLog(extraPrefixes = {}) {
  const prefixes = {
    info: "📱",
    success: "✅",
    warning: "⚠️",
    error: "❌",
    ...extraPrefixes,
  };

  return function log(message, type = "info") {
    const timestamp = new Date().toISOString();
    const prefix = prefixes[type] || prefixes.info || "📱";
    console.log(`${prefix} [${timestamp}] ${message}`);
  };
}

module.exports = { createAppStoreLog };
