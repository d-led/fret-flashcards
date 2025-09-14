const http = require("http");
const fs = require("fs");
const path = require("path");

// Generate a random port between 3000 and 9999
const port = Math.floor(Math.random() * 7000) + 3000;

module.exports = {
  reporter: "mocha-junit-reporter",
  reporterOptions: {
    mochaFile: "test-results/junit-[hash].xml"
  },
  e2e: {
    setupNodeEvents(on, config) {
      let server;

      // Start the server immediately on random port and serve `src/dist` statically
      const sirv = require("sirv");
      const distRoot = path.join(__dirname, "dist");
      const serve = sirv(distRoot, { dev: false, single: true });

      server = http.createServer((req, res) => {
        // Delegate static file serving to sirv (single: true will serve index.html for SPA)
        serve(req, res, () => {
          // If sirv didn't handle the request, return 404
          res.writeHead(404, { "Content-Type": "text/plain" });
          res.end("Not found");
        });
      });

      server
        .listen(port, () => {
          console.log(`Test server running on http://localhost:${port}`);
        })
        .on("error", (err) => {
          if (err.code === "EADDRINUSE") {
            console.log(`Port ${port} in use, trying ${port + 1}...`);
            server.listen(port + 1, () => {
              console.log(`Test server running on http://localhost:${port + 1}`);
            });
          }
        });

      on("task", {
        // stopServer task removed as server now runs for entire session
      });

      // Set the port in Cypress environment
      config.env = { ...config.env, port };

      return config;
    },
  },
};
