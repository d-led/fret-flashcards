import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    reporters: ["default", ["junit", { outputFile: "test-results/junit-vitest-property.xml" }]],
    include: ["tests-property/**/*.test.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/cypress/**", "**/.{idea,git,cache,output,temp}/**"],
  },
});
