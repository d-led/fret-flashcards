import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.join(__dirname, '..');

const app = express();
const port = 8080;

// Serve static files from dist directory (original app)
app.use(express.static(path.join(rootDir, 'dist')));

// Note: Quasar app serving has been removed

// Handle original app SPA routing - serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(rootDir, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
  console.log(`📱 App: http://localhost:${port}/`);
});
