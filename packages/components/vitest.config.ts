import { playwright } from "@vitest/browser-playwright"
import { fileURLToPath } from "url"
import { configDefaults, defineConfig } from "vitest/config"

const alias = {
  "~/": fileURLToPath(new URL("./src/", import.meta.url)),
}

// Tests that need a real DOM (hook rendering) are named
// `*.browser.test.ts` and run in real Chromium via Vitest Browser Mode
// instead of a simulated DOM. Pattern is relative to `dir: "src"`.
const BROWSER_TEST_PATTERN = "**/*.browser.test.{ts,tsx}"

export default defineConfig({
  test: {
    coverage: {
      provider: "istanbul",
      reportOnFailure: true,
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
          dir: "src",
          globals: true,
          exclude: [
            ...configDefaults.exclude,
            "**/playwright/**",
            "tests/load/**",
            BROWSER_TEST_PATTERN,
          ],
          alias,
        },
      },
      {
        extends: true,
        test: {
          name: "browser",
          dir: "src",
          globals: true,
          include: [BROWSER_TEST_PATTERN],
          alias,
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
