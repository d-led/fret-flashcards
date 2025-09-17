import http from "http";
import path from "path";
import fs from "fs";
import sirv from "sirv";
import { defineConfig } from "cypress";

// Generate a random port between 3000 and 9999, with fallback strategy
function findAvailablePort(startPort: number, maxAttempts: number = 10): Promise<number> {
  return new Promise((resolve, reject) => {
    if (maxAttempts <= 0) {
      reject(new Error(`Could not find available port after 10 attempts starting from ${startPort}`));
      return;
    }
    
    const server = http.createServer();
    
    server.listen(startPort, () => {
      const port = (server.address() as any)?.port;
      server.close(() => {
        // eslint-disable-next-line no-console
        console.log(`Found available port: ${port}`);
        resolve(port);
      });
    });
    
    server.on('error', (err: NodeJS.ErrnoException) => {
      if (err.code === 'EADDRINUSE') {
        // eslint-disable-next-line no-console
        console.log(`Port ${startPort} in use, trying ${startPort + 1}...`);
        // Try next port
        findAvailablePort(startPort + 1, maxAttempts - 1).then(resolve).catch(reject);
      } else {
        reject(err);
      }
    });
  });
}

const port = Math.floor(Math.random() * 7000) + 3000;

export default defineConfig({
  reporter: "mocha-junit-reporter",
  reporterOptions: {
    mochaFile: "test-results/junit-[hash].xml",
  },
  video: true,
  videoCompression: true,
  e2e: {
    async setupNodeEvents(on, config) {
      on("task", {
        copyScreenshot({ src, dest }: { src: string; dest: string }) {
          try {
            const resolvedSrc = path.resolve(src);
            const resolvedDest = path.resolve(dest);
            fs.mkdirSync(path.dirname(resolvedDest), { recursive: true });
            if (fs.existsSync(resolvedSrc)) {
              fs.copyFileSync(resolvedSrc, resolvedDest);
              return null;
            }
            return { error: `Source screenshot not found: ${resolvedSrc}` };
          } catch (err: any) {
            return { error: String(err && err.message ? err.message : err) };
          }
        },
      });
      let server: http.Server | undefined;

      // If a baseUrl is provided, skip starting the embedded server.
      // This allows running `npm run e2e -- --config baseUrl=https://...` without spawning a local server.
      const providedBase = config.baseUrl ?? config.env?.baseUrl;
      if (providedBase) {
        // eslint-disable-next-line no-console
        console.log(`baseUrl provided (${providedBase}) — skipping embedded test server.`);
        return config;
      }

      // Start the server on an available port and serve `dist` statically
      const distRoot = path.join(__dirname, "dist");
      const serve = sirv(distRoot, { dev: false, single: true });

      // Find an available port first
      const actualPort = await findAvailablePort(port);
      
      // eslint-disable-next-line no-console
      console.log(`Starting test server on port ${actualPort}...`);
      
      server = http.createServer((req, res) => {
        // Delegate static file serving to sirv (single: true will serve index.html for SPA)
        serve(req, res, () => {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("Not found");
        });
      });

      // Start server and wait for it to be ready with timeout
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error(`Server startup timeout after 10 seconds on port ${actualPort}`));
        }, 10000);
        
        server.listen(actualPort, () => {
          // eslint-disable-next-line no-console
          console.log(`Test server running on http://localhost:${actualPort}`);
          
          // Add a small delay to ensure server is fully ready
          setTimeout(() => {
            clearTimeout(timeout);
            resolve();
          }, 100);
        });
        
        server.on("error", (err: NodeJS.ErrnoException & { code?: string }) => {
          clearTimeout(timeout);
          // eslint-disable-next-line no-console
          console.error(`Server error on port ${actualPort}:`, err.message);
          reject(err);
        });
      });

      // Set the actual port in Cypress environment so tests can reference it
      config.env = { ...config.env, port: actualPort };

      return config;
    },
  },
});
