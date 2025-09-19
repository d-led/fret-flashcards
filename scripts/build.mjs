import fs from "fs";
import path from "path";
import { build } from "esbuild";
import { execSync } from "child_process";

const root = path.resolve(".");
const outdir = path.join(root, "dist");

// Get the publicPath from command line arguments (e.g., --publicPath=/my-repo/)
const publicPathArg = process.argv.find(arg => arg.startsWith('--publicPath='));
const publicPath = publicPathArg ? publicPathArg.split('=')[1] : '';

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function updateConfigsForPublicPath() {
  if (!publicPath) return;
  
  console.log(`Building with publicPath: ${publicPath}`);
  // No additional configuration needed for publicPath
}

function restoreConfigs() {
  if (!publicPath) return;
  
  console.log("Restoring original configs...");
  // No additional configuration needed for publicPath
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
    const utcDate = now
      .toISOString()
      .replace("T", " ")
      .replace(/\.\d+Z$/, " UTC");

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
    const stampText = "Build: " + stampParts.join(" ");

    // read and replace in the built JS file
    let jsContent = fs.readFileSync(jsFile, "utf8");
    jsContent = jsContent.replace(/"Build: unknown"/g, `"${stampText}"`);
    fs.writeFileSync(jsFile, jsContent, "utf8");

    console.log(`Replaced build info: ${stampText}`);
  } catch (e) {
    console.error("Failed to replace build info:", e);
  }
}

function minifyHTML() {
  try {
    const htmlFile = path.join(outdir, "index.html");
    if (!fs.existsSync(htmlFile)) {
      console.log("index.html not found, skipping HTML minification");
      return;
    }

    let html = fs.readFileSync(htmlFile, "utf8");
    // Remove HTML comments
    html = html.replace(/<!--[\s\S]*?-->/g, "");
    // Collapse whitespace between tags
    html = html.replace(/>\s+</g, "><");
    // Collapse multiple spaces/newlines to a single space
    html = html.replace(/\s{2,}/g, " ");
    html = html.trim();

    fs.writeFileSync(htmlFile, html, "utf8");
    console.log("Minified HTML: index.html");
  } catch (e) {
    console.error("Failed to minify HTML:", e);
  }
}

async function buildJS(watch = false) {
  // Update configs if publicPath is provided
  updateConfigsForPublicPath();
  
  const options = {
    entryPoints: [path.join("src", "ts", "index.ts"), path.join("src", "css", "main.css"), path.join("src", "static", "index.html"), path.join("src", "logo", "logo.svg")],
    bundle: true,
    sourcemap: true,
    outdir: outdir,
    target: ["es2019"],
    format: "iife",
    platform: "browser",
    // Minify only for non-watch (production) builds
    minify: !watch,
    logLevel: "info",
    loader: {
      ".html": "copy",
      ".css": "css",
      ".svg": "copy",
    },
    assetNames: "[name]",
    entryNames: "[name]",
  };

  if (watch) {
    // Use esbuild's context API for watch mode
    const { context } = await import("esbuild");

    const ctx = await context({
      ...options,
      plugins: [
        {
          name: "copy-vendor-assets",
          setup(build) {
            build.onStart(() => {
              console.log("Build starting...");
              copyVendorAssets();
            });
            build.onEnd(() => {
              console.log("Build complete");
              replaceBuildInfo();
            });
          },
        },
      ],
    });

    await ctx.watch();
    console.log("Watching for changes...");

    // Keep the process alive
    process.on("SIGINT", async () => {
      console.log("\nStopping watch mode...");
      await ctx.dispose();
      restoreConfigs();
      process.exit(0);
    });
  } else {
    try {
      copyVendorAssets();
      await build(options);
      replaceBuildInfo();
      if (!watch) {
        // JS and CSS are already minified by esbuild when !watch
        // Minify the copied HTML without external dependencies
        minifyHTML();
      }
      
      console.log("✅ Build complete!");
      if (publicPath) {
        console.log(`Your app will be available at: https://yourusername.github.io${publicPath}`);
      }
    } finally {
      // Always restore configs
      restoreConfigs();
    }
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
