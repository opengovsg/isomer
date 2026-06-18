/**
 * Vitest config for running pure unit tests in apps/studio/scripts/.
 *
 * Unlike vitest.config.ts, this config does NOT spin up testcontainers
 * (no globalSetup, no DB/mockpass setupFiles) — it is designed for tests
 * that exercise pure data-transformation logic with zero infrastructure.
 *
 * Usage:
 *   pnpm exec vitest run --config vitest.scripts.config.ts
 */
import tsconfigPaths from "vite-tsconfig-paths"
import { configDefaults, defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    include: ["scripts/**/*.test.ts"],
    retry: 0,
    globals: true,
    exclude: [...configDefaults.exclude],
  },
})
