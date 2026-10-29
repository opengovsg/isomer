import { argosVitestPlugin } from "@argos-ci/storybook/vitest-plugin"
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin"
import { playwright } from "@vitest/browser-playwright"
import { fileURLToPath } from "url"
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
      provider: "istanbul",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "**/__tests__/**",
        "**/*.test.{ts,tsx}",
        "**/*.stories.{ts,tsx}",
        "**/*.d.ts",
      ],
    },
    // Story console noise floods the CI output; keep it only for failed stories.
    silent: process.env.VITEST_STORYBOOK ? "passed-only" : undefined,
    // Storybook runs separately (VITEST_STORYBOOK=true) so unit runs never load
    // the Argos plugin, which uploads screenshots on CI.
    projects: process.env.VITEST_STORYBOOK
      ? [
          {
            extends: true,
            plugins: [
              storybookTest({
                configDir: fileURLToPath(
                  new URL(".storybook", import.meta.url),
                ),
              }),
              argosVitestPlugin({
                uploadToArgos:
                  !!process.env.CI && process.env.ARGOS_UPLOAD !== "false",
              }),
            ],
            optimizeDeps: {
              // Scan every story up front. Dependencies discovered mid-run make
              // Vite re-optimize and reload, which fails in-flight story imports.
              entries: ["src/**/*.stories.{ts,tsx}", ".storybook/preview.tsx"],
            },
            test: {
              name: "storybook",
              browser: {
                enabled: true,
                provider: playwright({
                  launchOptions: {
                    args: ["--disable-lcd-text", "--font-render-hinting=none"],
                  },
                }),
                headless: true,
                instances: [{ browser: "chromium" as const }],
              },
            },
          },
        ]
      : [
          {
            extends: true,
            test: {
              name: "node",
              include: [
                "src/**/*.test.{ts,tsx}",
                "prisma/scripts/**/*.test.ts",
                "scripts/**/*.test.ts",
                "tests/e2e/fixtures/**/*.test.ts",
              ],
              exclude: [
                ...configDefaults.exclude,
                // Playwright specs under tests/e2e/ are not in include; only
                // tests/e2e/fixtures/**/*.test.ts is allow-listed for Vitest.
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
                provider: playwright(),
                instances: [{ browser: "chromium" }],
                headless: !!process.env.CI,
              },
            },
          },
        ],
  },
})
