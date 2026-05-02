#!/usr/bin/env node
import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");

function read(relPath) {
  return readFileSync(path.join(repoRoot, relPath), "utf8");
}

function fail(message) {
  console.error(`security-codeql-guards: ${message}`);
  process.exitCode = 1;
}

const markdownPipeline = read("packages/render/src/markdown-pipeline.ts");
const validatePages = read("scripts/validate-pages-github-links.mjs");

if (markdownPipeline.includes('replace(/\\/+$/, "")')) {
  fail(
    "packages/render/src/markdown-pipeline.ts reintroduced trailing-slash regex trim (CodeQL js/polynomial-redos). Use linear trimTrailingSlashes().",
  );
}

if (!validatePages.includes('trimmed.startsWith("vbscript:")')) {
  fail(
    "scripts/validate-pages-github-links.mjs must reject vbscript: in localTargetPathFromRef() (CodeQL js/incomplete-url-scheme-check).",
  );
}

if (process.exitCode === 1) {
  process.exit(1);
}

console.log("security-codeql-guards: OK");
