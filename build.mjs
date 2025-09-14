import fs from 'fs';
import path from 'path';
import { build } from 'esbuild';

const root = path.resolve('.');
const outdir = path.join(root, 'dist');

function copyFile(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

async function run() {
  // ensure outdir exists and clean it but preserve dist/.gitkeep if present
  if (fs.existsSync(outdir)) {
    const entries = fs.readdirSync(outdir);
    for (const name of entries) {
      if (name === '.gitkeep') continue;
      const full = path.join(outdir, name);
      fs.rmSync(full, { recursive: true, force: true });
    }
  } else {
    fs.mkdirSync(outdir, { recursive: true });
  }

  // copy index.html
  copyFile(path.join('src', 'static', 'index.html'), path.join(outdir, 'index.html'));

  // copy css
  const cssSrc = path.join('src', 'css', 'main.css');
  const cssDest = path.join(outdir, 'main.css');
  if (fs.existsSync(cssSrc)) copyFile(cssSrc, cssDest);

  // build with esbuild targeting engines
  await build({
    entryPoints: [path.join('src', 'ts', 'index.ts')],
    bundle: true,
    sourcemap: true,
    outfile: path.join(outdir, 'index.js'),
    target: [
      'chrome58',
      'firefox57',
      'safari11',
      'edge16',
    ],
    format: 'iife',
    platform: 'browser',
    minify: false,
    logLevel: 'info',
  });
}

if (process.argv.includes('--watch')) {
  const chokidar = await import('chokidar');
  console.log('watch mode: rebuilding on change');
  const watcher = chokidar.watch(['src/ts/**', 'src/css/**', 'src/static/**']);
  let building = false;
  const rebuild = async () => {
    if (building) return;
    building = true;
    try {
      await run();
      console.log('build complete');
    } catch (err) {
      console.error(err);
    } finally {
      building = false;
    }
  };
  watcher.on('all', rebuild);
  // initial build
  await run();
} else {
  run().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
