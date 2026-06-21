import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    globalSetup: ["tests/global-setup.ts"],
    // The suite starts a Postgres container, replays all migrations and spawns
    // the publishing script as a subprocess, so hooks need generous timeouts
    testTimeout: 60_000,
    hookTimeout: 180_000,
  },
})
