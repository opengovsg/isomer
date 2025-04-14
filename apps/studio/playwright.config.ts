import { defineConfig, devices } from "@playwright/test"

const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000"

const opts = {
  // launch headless on CI, in browser locally
  headless: !!process.env.CI || !!process.env.PLAYWRIGHT_HEADLESS,
  // collectCoverage: !!process.env.PLAYWRIGHT_HEADLESS
}

export default defineConfig({
  globalSetup: "./tests/e2e/setup/globalSetup.ts",
  reporter: "list",
  testDir: "./tests/e2e",
  timeout: 35e3,
  projects: [
    {
      name: "e2e",
      outputDir: "./playwright/test-results",
      // 'github' for GitHub Actions CI to generate annotations, plus a concise 'dot'
      // default 'list' when running locally
      use: {
        ...devices["Desktop Chrome"],
        baseURL: baseUrl,
        headless: opts.headless,
        video: "on",
      },
    },
  ],
})
