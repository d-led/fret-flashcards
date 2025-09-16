import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    reporters: ["default", ["junit", { outputFile: "test-results/junit-vitest.xml" }]],
  },
});
