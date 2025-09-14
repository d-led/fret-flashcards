import fs from "fs";
import path from "path";
import { build } from "esbuild";
import { execSync } from "child_process";

const root = path.resolve(".");
const outdir = path.join(root, "dist");

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function copyVendorAssets() {
  // copy vendor libs from node_modules (vexflow and jquery)
  try {
    const vendorDest = path.join(outdir, "vendor");
    fs.mkdirSync(vendorDest, { recursive: true });
    copyFile(path.join("node_modules", "vexflow", "build", "cjs", "vexflow.js"), path.join(vendorDest, "vexflow.js"));
  } catch (e) {
    // ignore if not present
  }
  try {
    const vendorDest = path.join(outdir, "vendor");
    copyFile(path.join("node_modules", "jquery", "dist", "jquery.min.js"), path.join(vendorDest, "jquery.min.js"));
  } catch (e) {
    // ignore if not present
  }
}

function replaceBuildInfo() {
  try {
    const jsFile = path.join(outdir, "index.js");
    if (!fs.existsSync(jsFile)) {
      console.log("index.js not found, skipping build info replacement");
      return;
    }

    // build timestamp in UTC
    const now = new Date();
    const utcDate = now.toISOString().replace("T", " ").replace(/\.\d+Z$/, " UTC");

    // try to get short git hash
    let gitHash = "";
    try {
      gitHash = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
    } catch (e) {
      // ignore if git not available
      gitHash = "";
    }

    // prepare stamp text
    const stampParts = [utcDate];
    if (gitHash) stampParts.push(gitHash);
    const stampText = "build: " + stampParts.join(" ");

    // read and replace in the built JS file
    let jsContent = fs.readFileSync(jsFile, "utf8");
    jsContent = jsContent.replace(/"build: unknown"/g, `"${stampText}"`);
    fs.writeFileSync(jsFile, jsContent, "utf8");

    console.log(`Replaced build info: ${stampText}`);
  } catch (e) {
    console.error("Failed to replace build info:", e);
  }
}

async function buildJS(watch = false) {
  const options = {
    entryPoints: [
      path.join("src", "ts", "index.ts"),
      path.join("src", "css", "main.css"),
      path.join("src", "static", "index.html"),
      path.join("src", "logo", "logo.svg")
    ],
    bundle: true,
    sourcemap: true,
    outdir: outdir,
    target: ["es2019"],
    format: "iife",
    platform: "browser",
    minify: false,
    logLevel: "info",
    loader: {
      '.html': 'copy',
      '.css': 'copy',
      '.svg': 'copy'
    },
    assetNames: '[name]',
    entryNames: '[name]'
  };

  if (watch) {
    // Use esbuild's context API for watch mode
    const { context } = await import('esbuild');
    
    const ctx = await context({
      ...options,
      plugins: [
        {
          name: 'copy-vendor-assets',
          setup(build) {
            build.onStart(() => {
              console.log('Build starting...');
              copyVendorAssets();
            });
            build.onEnd(() => {
              console.log('Build complete');
              replaceBuildInfo();
            });
          },
        },
      ],
    });
    
    await ctx.watch();
    console.log('Watching for changes...');
    
    // Keep the process alive
    process.on('SIGINT', async () => {
      console.log('\nStopping watch mode...');
      await ctx.dispose();
      process.exit(0);
    });
  } else {
    copyVendorAssets();
    await build(options);
    replaceBuildInfo();
  }
}

if (process.argv.includes("--watch")) {
  buildJS(true);
} else {
  buildJS(false).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
