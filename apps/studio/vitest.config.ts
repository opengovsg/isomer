import tsconfigPaths from "vite-tsconfig-paths"
import { type EnvironmentOptions } from "vitest-environment-testcontainers"
import { configDefaults, defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    retry: 0,
    globals: true,
    exclude: [...configDefaults.exclude, "**/playwright/**", "tests/load/**"],
    setupFiles: ["tests/mocks/db.ts"],
    globalSetup: ["tests/global-setup.ts"],
  },
})
