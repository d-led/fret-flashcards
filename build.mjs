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

function copyAssets() {
  // ensure outdir exists and clean it but preserve dist/.gitkeep if present
  if (fs.existsSync(outdir)) {
    const entries = fs.readdirSync(outdir);
    for (const name of entries) {
      if (name === ".gitkeep") continue;
      const full = path.join(outdir, name);
      fs.rmSync(full, { recursive: true, force: true });
    }
  } else {
    fs.mkdirSync(outdir, { recursive: true });
  }

  // copy index.html (no longer injecting build stamp since it's handled in JS)
  const indexSrc = path.join("src", "static", "index.html");
  const indexDest = path.join(outdir, "index.html");
  copyFile(indexSrc, indexDest);

  // copy vendor libs from node_modules (vexflow and jquery)
  try {
    const vendorDest = path.join(outdir, "vendor");
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

  // copy css
  const cssSrc = path.join("src", "css", "main.css");
  const cssDest = path.join(outdir, "main.css");
  if (fs.existsSync(cssSrc)) copyFile(cssSrc, cssDest);

  // copy favicon from logo
  const logoSrc = path.join("src", "logo", "logo.svg");
  const faviconDest = path.join(outdir, "favicon.svg");
  if (fs.existsSync(logoSrc)) copyFile(logoSrc, faviconDest);
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
    entryPoints: [path.join("src", "ts", "index.ts")],
    bundle: true,
    sourcemap: true,
    outfile: path.join(outdir, "index.js"),
    target: ["es2019"],
    format: "iife",
    platform: "browser",
    minify: false,
    logLevel: "info",
  };

  if (watch) {
    // Use esbuild's context API for watch mode
    const { context } = await import('esbuild');
    
    const ctx = await context({
      ...options,
      plugins: [
        {
          name: 'copy-assets',
          setup(build) {
            build.onStart(() => {
              console.log('Build starting...');
              copyAssets();
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
    copyAssets();
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
