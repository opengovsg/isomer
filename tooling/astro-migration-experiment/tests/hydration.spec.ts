import { PAGES, settle, test, expect } from "./fixtures"

// Each page is loaded fresh and with the "dismissed" flags already in sessionStorage, so state that
// differs from the server HTML on the first client render shows up as a hydration warning.
const DISMISSED = {
  "notification-dismissed": "true",
  "unsupported-browser-banner-dismissed": "true",
}

for (const [name, path] of Object.entries(PAGES)) {
  for (const dismissed of [false, true]) {
    test(`${name} hydrates without mismatches${dismissed ? " (banners dismissed)" : ""}`, async ({
      page,
      errors: _,
    }) => {
      if (dismissed)
        await page.addInitScript((flags) => {
          for (const [key, value] of Object.entries(flags))
            sessionStorage.setItem(key, value)
        }, DISMISSED)
      await page.goto(path)
      // Scroll through the page so `visible` islands hydrate too.
      await page.evaluate(async () => {
        for (let y = 0; y < document.body.scrollHeight; y += 400) {
          window.scrollTo(0, y)
          await new Promise((resolve) => setTimeout(resolve, 50))
        }
      })
      await settle(page)
      if (dismissed)
        await expect(
          page.getByText("Some services will be unavailable on Saturday."),
        ).toBeHidden()
    })
  }
}

// The notification banner is the one island with a slot (its body is server-rendered children).
test("notification shows, dismisses, and stays dismissed", async ({
  page,
  errors: _,
}) => {
  const body = page.getByText("Some services will be unavailable on Saturday.")
  await page.goto(PAGES.home)
  await settle(page)
  await expect(body).toBeVisible()
  await page
    .getByRole("button", { name: "Dismiss notification temporarily" })
    .click()
  await expect(body).toBeHidden()
  await page.goto(PAGES.article)
  await settle(page)
  await expect(body).toBeHidden()
})
