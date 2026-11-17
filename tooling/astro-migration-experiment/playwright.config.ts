import { defineConfig } from "@playwright/test"

// Next (apps/template/out) is the reference. Run `--project=next --update-snapshots` to record
// its screenshots, then `--project=astro` to compare the Astro build against them.
const builds = {
  next: ["../../apps/template/out", 4101],
  astro: ["../../apps/template-astro/out", 4102],
} as const

export default defineConfig({
  testDir: "tests",
  snapshotPathTemplate: "{testDir}/__screenshots__/{arg}{ext}",
  fullyParallel: true,
  reporter: "list",
  expect: {
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: "disabled" },
  },
  projects: Object.entries(builds).map(([name, [, port]]) => ({
    name,
    use: { baseURL: `http://localhost:${port}` },
  })),
  webServer: Object.values(builds).map(([dir, port]) => ({
    command: `node scripts/serve.mjs ${dir} ${port}`,
    port,
    reuseExistingServer: true,
  })),
})
