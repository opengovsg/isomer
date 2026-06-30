import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["tests/full-build/**/*.test.ts"],
    globalSetup: ["tests/global-setup.ts"],
    // The suite starts a Postgres container, replays all migrations, runs the
    // publishing script and then a full Next.js static export of the template
    testTimeout: 60_000,
    hookTimeout: 900_000,
  },
})
