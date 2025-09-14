import http from "http";
import path from "path";
import sirv from "sirv";
import { defineConfig } from "cypress";

// Generate a random port between 3000 and 9999
const port = Math.floor(Math.random() * 7000) + 3000;

export default defineConfig({
  reporter: "mocha-junit-reporter",
  reporterOptions: {
    mochaFile: "test-results/junit-[hash].xml",
  },
  e2e: {
    setupNodeEvents(on, config) {
      // Reference 'on' to satisfy strict compiler settings (it's unused by this config)
      void on;
      let server: http.Server;

      // Start the server immediately on random port and serve `dist` statically
      const distRoot = path.join(__dirname, "dist");
      const serve = sirv(distRoot, { dev: false, single: true });

      server = http.createServer((req, res) => {
        // Delegate static file serving to sirv (single: true will serve index.html for SPA)
        serve(req, res, () => {
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("Not found");
        });
      });

      server
        .listen(port, () => {
          // eslint-disable-next-line no-console
          console.log(`Test server running on http://localhost:${port}`);
        })
        .on("error", (err: NodeJS.ErrnoException & { code?: string }) => {
          if (err.code === "EADDRINUSE") {
            // eslint-disable-next-line no-console
            console.log(`Port ${port} in use, trying ${port + 1}...`);
            server.listen(port + 1, () => {
              // eslint-disable-next-line no-console
              console.log(`Test server running on http://localhost:${port + 1}`);
            });
          }
        });

      // Set the port in Cypress environment
      config.env = { ...config.env, port };

      return config;
    },
  },
});
