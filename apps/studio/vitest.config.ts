import { configDefaults, defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}", "prisma/scripts/**/*.test.ts"],
    retry: 0,
    globals: true,
    exclude: [...configDefaults.exclude, "**/tests/e2e/**", "tests/load/**"],
    setupFiles: ["tests/mocks/db.ts", "tests/mocks/mockpass.ts"],
    globalSetup: ["tests/global-setup.ts"],
    coverage: {
      provider: "istanbul",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "**/__tests__/**",
        "**/*.test.{ts,tsx}",
        "**/*.stories.{ts,tsx}",
        "**/*.d.ts",
      ],
    },
  },
})
