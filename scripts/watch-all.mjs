import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('🚀 Starting watch mode for both apps...\n');

// Start the original app watch process
const originalWatch = spawn('node', ['scripts/build.mjs', '--watch'], {
  cwd: rootDir,
  stdio: 'pipe'
});

// Note: Quasar watch process has been removed

// Handle original app output
originalWatch.stdout.on('data', (data) => {
  console.log(`[Original App] ${data.toString().trim()}`);
});

originalWatch.stderr.on('data', (data) => {
  console.error(`[Original App Error] ${data.toString().trim()}`);
});

// Note: Quasar app output handling removed

// Handle process exits
originalWatch.on('close', (code) => {
  console.log(`[Original App] Process exited with code ${code}`);
});

// Note: Quasar process exit handling removed

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping watch mode...');
  originalWatch.kill('SIGINT');
  process.exit(0);
});

// Handle process errors
originalWatch.on('error', (err) => {
  console.error('[Original App] Failed to start:', err);
});

// Note: Quasar error handling removed

console.log('✅ Watch process started!');
console.log('📱 Original app builds to: dist/');
console.log('Run "npm run serve" in another terminal to serve the app.');
console.log('Press Ctrl+C to stop watch process.\n');
