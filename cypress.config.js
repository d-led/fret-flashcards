const http = require("http");
const fs = require("fs");
const path = require("path");

// Generate a random port between 3000 and 9999
const port = Math.floor(Math.random() * 7000) + 3000;

module.exports = {
  e2e: {
    setupNodeEvents(on, config) {
      let server;

      // Start the server immediately on random port
      server = http.createServer((req, res) => {
        if (req.url === "/" || req.url === "/index.html") {
          const filePath = path.join(__dirname, "src", "static", "index.html");
          fs.readFile(filePath, (err, data) => {
            if (err) {
              res.writeHead(500);
              res.end("Error loading index.html");
              return;
            }
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(data);
          });
        } else {
          res.writeHead(404);
          res.end("Not found");
        }
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
