import type { Page } from "@playwright/test"

/** Mock S3 PUT and asset CDN GET so logo upload E2E can complete without real storage. */
export const mockAssetUploadRoutes = async (page: Page) => {
  await page.route(
    (url) => url.hostname === "user-content.example.com",
    (route) =>
      route.fulfill({
        status: 200,
        body: Buffer.from("fake-image"),
        contentType: "image/png",
      }),
  )

  await page.route("**/*", async (route) => {
    const request = route.request()
    const url = new URL(request.url())

    if (
      request.method() === "PUT" &&
      !url.hostname.includes("localhost") &&
      !url.hostname.includes("127.0.0.1")
    ) {
      await route.fulfill({ status: 200 })
      return
    }

    await route.continue()
  })
}

/** Drop the in-memory GrowthBook singleton before the next app navigation. */
export const resetGrowthBookPage = async (page: Page) => {
  await page.goto("about:blank")
}

type GrowthBookFeaturesResponse = {
  features: Record<string, { defaultValue?: unknown; rules?: unknown[] }>
}

/** Patch a GrowthBook feature into the CDN features response before navigation. */
export const enableGrowthBookFeature = async (
  page: Page,
  featureKey: string,
  value: unknown,
) => {
  await page.route("https://cdn.growthbook.io/**", async (route) => {
    const url = route.request().url()
    if (!url.includes("/api/features/")) {
      await route.continue()
      return
    }

    let body: GrowthBookFeaturesResponse
    try {
      const response = await route.fetch()
      body = (await response.json()) as GrowthBookFeaturesResponse
    } catch {
      body = { features: {} }
    }

    body.features[featureKey] = { defaultValue: value }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
    })
  })
}
