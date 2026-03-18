import tsconfigPaths from "vite-tsconfig-paths"
import { configDefaults, defineConfig } from "vitest/config"

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    retry: 0,
    globals: true,
    include: ["src/**/*.test.ts"],
    exclude: [
      ...configDefaults.exclude,
      "**/tests/e2e/**",
      "tests/load/**",
    ],
    setupFiles: ["tests/mocks/db.ts"],
    globalSetup: ["tests/global-setup.ts"],
    coverage: {
      provider: "istanbul",
      include: ["src/**/*.ts"],
      exclude: [
        "**/*.test.ts",
        "**/__tests__/**",
        "**/__test__/**",
        "**/{dist,build,.next,.turbo,coverage,storybook-static}/**",
      ],
    },
  },
})
