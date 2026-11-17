import { PAGES, settle, test, expect } from "./fixtures"

for (const [name, path] of Object.entries(PAGES)) {
  for (const [device, viewport] of [
    ["desktop", { width: 1280, height: 800 }],
    ["mobile", { width: 390, height: 844 }],
  ] as const) {
    test(`${name} renders the same (${device})`, async ({
      page,
      errors: _,
    }) => {
      await page.setViewportSize(viewport)
      await page.goto(path)
      await settle(page)
      await expect(page).toHaveScreenshot(`${name}-${device}.png`, {
        fullPage: true,
      })
    })
  }
}
