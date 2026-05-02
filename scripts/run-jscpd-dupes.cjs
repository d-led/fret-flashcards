#!/usr/bin/env node
"use strict";

/**
 * jscpd duplicate run for Commentray: same detection as the stock CLI, but the summary table
 * uses a green header when there are no duplicated lines, yellow when duplication is
 * under 1% of total lines, and red otherwise (cli-table3 defaults the header to red).
 */
const { createHash } = require("node:crypto");
const { join } = require("node:path");
const { getDefaultOptions, getModeHandler, Statistic, MemoryStore } = require("@jscpd/core");
const {
  BlamerHook,
  FragmentsHook,
  getFilesToDetect,
  InFilesDetector,
  ProgressSubscriber,
  ThresholdReporter,
  VerboseSubscriber,
} = require("@jscpd/finder");
const { getSupportedFormats, Tokenizer } = require("@jscpd/tokenizer");
const Table = require("cli-table3");
const { bold, grey, italic } = require("colors/safe");

const TIMER_LABEL = "time";

const TABLE_HEAD = [
  "Format",
  "Files analyzed",
  "Total lines",
  "Total tokens",
  "Clones found",
  "Duplicated lines",
  "Duplicated tokens",
];

const JSCPD_IGNORE =
  process.env.COMMENTRAY_JSCPD_IGNORE ||
  "**/node_modules/**,**/dist/**,**/coverage/**,**/.cache/**,**/.git/**,packages/code-commentray-static/site/**,*.vsix,.yarn/**";

function headerColorize(statistic) {
  const dupLines = statistic.total.duplicatedLines;
  const totalLines = statistic.total.lines;
  const dupPct = totalLines > 0 ? (100 * dupLines) / totalLines : 0;
  if (dupLines === 0) {
    return (s) => `\u001b[32m${s}\u001b[0m`;
  }
  if (dupPct < 1) {
    return (s) => `\u001b[33m${s}\u001b[0m`;
  }
  return (s) => `\u001b[31m${s}\u001b[0m`;
}

function convertStatisticToArray(format, statistic) {
  return [
    format,
    `${statistic.sources}`,
    `${statistic.lines}`,
    `${statistic.tokens}`,
    `${statistic.clones}`,
    `${statistic.duplicatedLines} (${statistic.percentage}%)`,
    `${statistic.duplicatedTokens} (${statistic.percentageTokens}%)`,
  ];
}

class DupesSummaryConsoleReporter {
  constructor(options) {
    this.options = options;
  }

  report(clones, statistic) {
    if (!statistic || this.options.silent) {
      return;
    }
    const colorize = headerColorize(statistic);
    const table = new Table({ head: TABLE_HEAD.map((h) => colorize(h)) });
    Object.keys(statistic.formats)
      .filter((format) => statistic.formats[format].sources)
      .forEach((format) => {
        table.push(convertStatisticToArray(format, statistic.formats[format].total));
      });
    table.push(convertStatisticToArray(bold("Total:"), statistic.total));
    console.log(table.toString());
    console.log(grey(`Found ${clones.length} clones.`));
  }
}

function registerReporters(options, detector) {
  detector.registerReporter(new DupesSummaryConsoleReporter(options));
  detector.registerReporter(new ThresholdReporter(options));
}

function registerSubscribers(options, detector) {
  if (options.verbose) {
    detector.registerSubscriber(new VerboseSubscriber(options));
  }
  if (!options.silent && !options.reporters?.includes("ai")) {
    detector.registerSubscriber(new ProgressSubscriber(options));
  }
}

function registerHooks(options, detector) {
  detector.registerHook(new FragmentsHook());
  if (options.blame) {
    detector.registerHook(new BlamerHook());
  }
}

const defaultHash = (value) => createHash("md5").update(value).digest("hex");

function detectClonesWithDupesTable(opts) {
  const options = { ...getDefaultOptions(), ...opts };
  options.format = options.format || getSupportedFormats();
  const files = getFilesToDetect(options);
  options.hashFunction = options.hashFunction || defaultHash;
  const store = new MemoryStore();
  const statistic = new Statistic();
  const tokenizer = new Tokenizer();
  const detector = new InFilesDetector(tokenizer, store, statistic, options);
  registerReporters(options, detector);
  registerSubscribers(options, detector);
  registerHooks(options, detector);
  if (!options.silent) {
    console.time(italic(grey(TIMER_LABEL)));
  }
  return detector
    .detect(files)
    .then((clones) => {
      if (!options.silent) {
        console.timeEnd(italic(grey(TIMER_LABEL)));
      }
      return clones;
    })
    .finally(() => {
      store.close();
    });
}

const repoRoot = join(__dirname, "..");
process.chdir(repoRoot);

detectClonesWithDupesTable({
  path: ["."],
  pattern: "**/*.{ts,tsx,mjs,cjs,js}",
  ignore: JSCPD_IGNORE.split(","),
  minLines: 10,
  minTokens: 70,
  mode: getModeHandler("strict"),
  threshold: 1,
  reporters: [],
  silent: false,
}).catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
