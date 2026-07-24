import { defineConfig, devices } from "@playwright/test"

import { ROLES, storageStateFor } from "./tests/e2e/fixtures/auth"

const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://localhost:3000"

const opts = {
  // launch headless on CI, in browser locally
  headless: !!process.env.CI || !!process.env.PLAYWRIGHT_HEADLESS,
  // collectCoverage: !!process.env.PLAYWRIGHT_HEADLESS
}

const baseUse = {
  ...devices["Desktop Chrome"],
  baseURL: baseUrl,
  headless: opts.headless,
  video: "retain-on-failure" as const,
}

export default defineConfig({
  reporter: process.env.CI ? "github" : "list",
  testDir: "./tests/e2e",
  outputDir: "./tests/e2e/test-results", // CI uploads this path as the e2e-test-results artifact (.github/workflows/ci.yml)
  timeout: 35e3,
  fullyParallel: true, // run tests fully in parallel
  forbidOnly: !!process.env.CI, // prevent .only in CI
  workers: process.env.CI ? 2 : undefined, // 2 workers on CI, auto locally
  globalSetup: "./tests/e2e/global-setup.ts",
  projects: [
    {
      name: "unauthenticated",
      testMatch: /smoke\.test\.ts/,
      use: { ...baseUse },
    },
    // singpass.test.ts stays skipped; isolated project so it never runs under role greps
    {
      name: "singpass",
      testMatch: /singpass\.test\.ts/,
      use: { ...baseUse },
    },
    ...ROLES.map((role) => ({
      name: role,
      grep: new RegExp(`@${role}\\b`),
      use: { ...baseUse, storageState: storageStateFor(role) },
    })),
  ],
})
