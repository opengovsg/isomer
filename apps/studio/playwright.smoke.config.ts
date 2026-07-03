import { defineConfig } from "@playwright/test"

import baseConfig from "./playwright.config"

// Smoke config for running against a DEPLOYED, remote environment (e.g. staging
// ECS after a deploy). It EXTENDS playwright.config.ts and changes only what a
// remote run requires, so the shared settings (reporter, timeout, browser, etc.)
// never drift. The differences:
//   - NO globalSetup: the e2e globalSetup writes directly to a local DB and does
//     a Mockpass login; it must never run against a real environment.
//   - selects only the smoke suite (by path), which is unauthenticated + read-only
//   - retries + trace, because a live shared environment is inherently less stable
//   - requires PLAYWRIGHT_TEST_BASE_URL (no localhost default)
//
// Point it at the target with PLAYWRIGHT_TEST_BASE_URL, e.g.
//   PLAYWRIGHT_TEST_BASE_URL=https://staging-studio.isomer.gov.sg pnpm test:smoke
const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL

if (!baseUrl) {
  throw new Error(
    "PLAYWRIGHT_TEST_BASE_URL must be set for the smoke suite (the deployed URL to hit).",
  )
}

const baseProject = baseConfig.projects?.[0]

export default defineConfig({
  ...baseConfig,
  globalSetup: undefined,
  testMatch: /smoke\.test\.ts$/,
  retries: 2,
  forbidOnly: !!process.env.CI,
  projects: [
    {
      ...baseProject,
      name: "smoke",
      outputDir: "./tests/e2e/smoke-results",
      use: {
        ...baseProject?.use,
        baseURL: baseUrl,
        // Smoke is an unattended deploy gate — always headless.
        // Pass `--headed` on the CLI when debugging a failure locally.
        headless: true,
        trace: "retain-on-failure",
      },
    },
  ],
})
