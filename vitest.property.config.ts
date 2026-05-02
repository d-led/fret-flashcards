import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    /** No `tests-property/` files yet; keep `npm run test:all` usable in CI. */
    passWithNoTests: true,
    environment: "jsdom",
    reporters: ["default", ["junit", { outputFile: "test-results/junit-vitest-property.xml" }]],
    include: ["tests-property/**/*.test.ts"],
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/cypress/**",
      "**/.{idea,git,cache,output,temp}/**",
    ],
  },
});
