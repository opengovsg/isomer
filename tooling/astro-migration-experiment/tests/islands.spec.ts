import { PAGES, settle, test, expect } from "./fixtures"

test("mobile navbar menu opens", async ({ page, errors: _ }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto(PAGES.home)
  await settle(page)
  await page.getByRole("button", { name: "Open navigation menu" }).click()
  await expect(
    page.getByRole("button", { name: "Close navigation menu" }),
  ).toBeVisible()
})

test("desktop navbar item expands", async ({ page, errors: _ }) => {
  await page.goto(PAGES.home)
  await settle(page)
  await page
    .getByRole("button", { name: "Expandable nav item" })
    .first()
    .click()
  await expect(
    page.getByRole("button", { name: "Close navigation item" }),
  ).toBeVisible()
})

test("hero carousel changes slide", async ({ page, errors: _ }) => {
  await page.goto(PAGES.home)
  await settle(page)
  const carousel = page.getByRole("region", { name: "Hero carousel" })
  await carousel.getByRole("button", { name: "Pause slide rotation" }).click()
  await carousel.getByRole("button", { name: "Next slide" }).click()
  await expect(carousel.getByText(/^Slide 2:/)).toBeInViewport()
})

test("hero carousel keeps hidden slides inert", async ({ page, errors: _ }) => {
  await page.goto(PAGES.home)
  await settle(page)
  const carousel = page.getByRole("region", { name: "Hero carousel" })
  await carousel.getByRole("button", { name: "Pause slide rotation" }).click()
  await carousel.getByRole("button", { name: "Next slide" }).click()
  const slides = carousel.locator('[aria-roledescription="slide"]')
  await expect(slides.nth(0)).toHaveJSProperty("inert", true)
  await expect(slides.nth(1)).toHaveJSProperty("inert", false)
})

test("image gallery navigates", async ({ page, errors: _ }) => {
  await page.goto(PAGES.content)
  const gallery = page.getByRole("region", { name: "Image gallery" })
  await gallery.scrollIntoViewIfNeeded()
  await settle(page)
  await gallery.getByRole("button", { name: "Next image" }).click()
  await expect(
    gallery.getByRole("button", { name: /View image 2 of/ }),
  ).toHaveAttribute("aria-current", /true/)
})

test("collection filters by tag", async ({ page, errors: _ }) => {
  await page.goto(PAGES.collection)
  await settle(page)
  const cards = page.locator('main a[href^="/collection-1/article-"]')
  const firstBefore = await cards.first().getAttribute("href")
  await page
    .getByText(/^Announcements \(\d+\)$/)
    .first()
    .click()
  await expect(page).toHaveURL(/filters=/)
  // Announcements are every 4th article, so the result list must change.
  await expect(cards.first()).not.toHaveAttribute("href", firstBefore!)
})

test("collection paginates", async ({ page, errors: _ }) => {
  await page.goto(PAGES.collection)
  await settle(page)
  await page.getByRole("button", { name: "Go to next page" }).click()
  await expect(
    page.getByRole("button", { name: "Go to previous page" }),
  ).toBeEnabled()
})

test("database table search filters rows", async ({ page, errors: _ }) => {
  await page.goto(PAGES.database)
  await settle(page)
  await page
    .getByRole("searchbox", { name: "Search table" })
    .fill("zzz-no-match")
  await expect(page.getByText(/No search results/).first()).toBeVisible()
})
