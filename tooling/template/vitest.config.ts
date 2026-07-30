import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["**/*.test.ts"],
          exclude: ["tests/**", "node_modules/**"],
          globals: true,
        },
      },
      {
        extends: true,
        test: {
          name: "e2e",
          include: ["tests/**/*.test.ts"],
          testTimeout: 650_000,
          hookTimeout: 900_000,
          fileParallelism: false,
          maxWorkers: 1,
        },
      },
    ],
  },
})
