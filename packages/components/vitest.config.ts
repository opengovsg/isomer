import { argosVitestPlugin } from "@argos-ci/storybook/vitest-plugin"
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin"
import react from "@vitejs/plugin-react"
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
  plugins: [react()],
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
                // Argos grows the iframe to the in-flow content height, but our
                // viewports have no px height so it otherwise stays at the 150px
                // iframe default. Fixed overlays (drawers, modals) add no in-flow
                // height and get clipped, so give the body a viewport's worth.
                // 720 matches the fallback height in viewport-size.mjs.
                argosCSS: "body:has([role='dialog']) { min-height: 720px; }",
              }),
            ],
            optimizeDeps: {
              // Scan every story up front. Dependencies discovered mid-run make
              // Vite re-optimize and reload, which fails in-flight story imports.
              entries: ["src/**/*.stories.{ts,tsx}", ".storybook/preview.tsx"],
            },
            test: {
              name: "storybook",
              alias,
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
              setupFiles: ["src/__tests__/browserSetup.ts"],
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
