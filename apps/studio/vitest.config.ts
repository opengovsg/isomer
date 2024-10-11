import tsconfigPaths from "vite-tsconfig-paths"
import { configDefaults, defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    exclude: [...configDefaults.exclude, "**/playwright/**", "tests/load/**"],
    setupFiles: ["vitest.setup.ts"],
  },
})
