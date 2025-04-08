import { defineConfig, devices } from "@playwright/test"

const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000"
console.log(`ℹ️ Using base URL "${baseUrl}"`)

const opts = {
  // launch headless on CI, in browser locally
  headless: !!process.env.CI || !!process.env.PLAYWRIGHT_HEADLESS,
  // collectCoverage: !!process.env.PLAYWRIGHT_HEADLESS
}

export default defineConfig({
  reporter: process.env.CI ? "github" : "list",
  testDir: "./playwright",
  timeout: 35e3,
  projects: [
    { name: "Setup db", testMatch: "setup/db.ts" },
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
      dependencies: ["Setup db"],
    },
  ],
})
