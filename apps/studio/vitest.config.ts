import tsconfigPaths from "vite-tsconfig-paths"
import { configDefaults, defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    retry: 0,
    globals: true,
    exclude: [...configDefaults.exclude, "**/tests/e2e/**", "tests/load/**"],
    setupFiles: ["tests/mocks/db.ts"],
    globalSetup: ["tests/global-setup.ts"],
    coverage: {
      provider: "istanbul",
    },
  },
})
