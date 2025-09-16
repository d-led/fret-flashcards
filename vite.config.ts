import { defineConfig } from "vite";

export default defineConfig({
  server: {
    https: {
      cert: "/tmp/fret-cert.pem",
      key: "/tmp/fret-cert-key.pem",
    },
    host: "0.0.0.0",
  },
  preview: {
    https: {
      cert: "/tmp/fret-cert.pem",
      key: "/tmp/fret-cert-key.pem",
    },
    host: "0.0.0.0",
  },
});
