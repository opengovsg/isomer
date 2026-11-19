import { test as base, expect } from "@playwright/test"

export const PAGES = {
  home: "/",
  content: "/content/",
  collection: "/collection-1/",
  article: "/collection-1/article-1/",
  database: "/database/",
  notFound: "/does-not-exist/",
}

// Fails the test on any page error or hydration problem: the islands' hydration check in development
// builds, or React's errors (#418/#423/#425) on the Next build.
const HYDRATION_PROBLEM =
  /hydrat|server HTML|did not match|Did not expect server|Minified React error #4(18|23|25)/i
export const test = base.extend<{ errors: string[] }>({
  errors: async ({ page }, use) => {
    const errors: string[] = []
    page.on("pageerror", (e) => errors.push(e.message))
    page.on("console", (m) => {
      // First line only: the attached component stack mentions hydration functions for any warning.
      if (
        m.type() === "error" &&
        HYDRATION_PROBLEM.test(m.text().split("\n")[0] ?? "")
      )
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
