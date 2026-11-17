import { test as base, expect } from "@playwright/test"

export const PAGES = {
  home: "/",
  content: "/content/",
  collection: "/collection-1/",
  article: "/collection-1/article-1/",
  database: "/database/",
  notFound: "/does-not-exist/",
}

// Fails the test on any page error or React hydration error (minified #418/#423/#425).
export const test = base.extend<{ errors: string[] }>({
  errors: async ({ page }, use) => {
    const errors: string[] = []
    page.on("pageerror", (e) => errors.push(e.message))
    page.on("console", (m) => {
      if (m.type() === "error" && /react|hydrat/i.test(m.text()))
        errors.push(m.text())
    })
    await use(errors)
    expect(errors).toEqual([])
  },
})
export { expect }

// Islands hydrate asynchronously; give `load` islands a moment after the load event.
export const settle = async (page: import("@playwright/test").Page) => {
  await page.waitForLoadState("networkidle")
  await page.waitForTimeout(300)
}
