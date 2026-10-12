import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    testTimeout: 650_000,
    hookTimeout: 900_000,
    fileParallelism: false,
    maxWorkers: 1,
  },
})
