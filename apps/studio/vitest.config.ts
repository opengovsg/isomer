import { playwright } from "@vitest/browser-playwright"
import { configDefaults, defineConfig } from "vitest/config"

// Tests that need a real DOM (component/hook rendering) are named
// `*.browser.test.{ts,tsx}` and run in real Chromium via Vitest Browser Mode
// instead of a simulated DOM. Everything else runs in the "node" project.
const BROWSER_TEST_PATTERN = "src/**/*.browser.test.{ts,tsx}"

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    coverage: {
      exclude: [
        "**/__tests__/**",
        "**/*.test.{ts,tsx}",
        "**/*.stories.{ts,tsx}",
        "**/*.d.ts",
      ],
      include: ["src/**/*.{ts,tsx}"],
      provider: "istanbul",
    },
    projects: [
      {
        extends: true,
        test: {
          env: {
            // Unit tests expect a stable public app URL in audit export emails;
            // omit from .env.test so E2E Singpass OAuth keeps localhost redirects.
            NEXT_PUBLIC_APP_URL: "https://studio.test.gov.sg",
          },
          exclude: [
            ...configDefaults.exclude,
            "**/tests/e2e/**",
            "tests/load/**",
            BROWSER_TEST_PATTERN,
          ],
          globalSetup: ["tests/global-setup.ts"],
          globals: true,
          include: ["src/**/*.test.{ts,tsx}", "prisma/scripts/**/*.test.ts"],
          name: "node",
          retry: 0,
          setupFiles: ["tests/mocks/db.ts", "tests/mocks/mockpass.ts"],
        },
      },
      {
        extends: true,
        test: {
          browser: {
            enabled: true,
            // oxlint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call -- vitest browser provider typing
            provider: playwright(),
            instances: [{ browser: "chromium" }],
            headless: !!process.env.CI,
          },
          globals: true,
          include: [BROWSER_TEST_PATTERN],
          name: "browser",
          retry: 0,
        },
      },
    ],
  },
})
