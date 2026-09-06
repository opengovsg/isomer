import { playwright } from "@vitest/browser-playwright"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { configDefaults, defineConfig } from "vitest/config"

const studioRoot = fileURLToPath(new URL(".", import.meta.url))

// Tests that need a real DOM (component/hook rendering) are named
// `*.browser.test.{ts,tsx}` and run in real Chromium via Vitest Browser Mode
// instead of a simulated DOM. Everything else runs in the "node" project.
const BROWSER_TEST_PATTERN = "src/**/*.browser.test.{ts,tsx}"

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      "~/server/modules/database/database": path.resolve(
        studioRoot,
        "tests/mocks/database-shim.ts",
      ),
      "~/server/prisma": path.resolve(
        studioRoot,
        "tests/mocks/database-shim.ts",
      ),
    },
  },
  test: {
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
    projects: [
      {
        extends: true,
        test: {
          name: "node",
          include: ["src/**/*.test.{ts,tsx}", "prisma/scripts/**/*.test.ts"],
          exclude: [
            ...configDefaults.exclude,
            "**/tests/e2e/**",
            "tests/load/**",
            BROWSER_TEST_PATTERN,
          ],
          retry: 0,
          globals: true,
          setupFiles: ["tests/mocks/db.ts", "tests/mocks/mockpass.ts"],
          globalSetup: ["tests/global-setup.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "browser",
          include: [BROWSER_TEST_PATTERN],
          retry: 0,
          globals: true,
          browser: {
            enabled: true,
            // oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call -- vitest browser provider typing
            provider: playwright(),
            instances: [{ browser: "chromium" }],
            headless: !!process.env.CI,
          },
        },
      },
    ],
  },
})
