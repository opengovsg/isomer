import type { Page } from "@playwright/test"
import crypto from "crypto"

/** Fake S3 PUT and CDN GET for logo upload tests. */
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

    // GETs to the assets host must use fallback(). continue() skips earlier
    // handlers and hits the real network.
    await route.fallback()
  })
}

/** Stub asset.getPresignedPutUrl. Real presign needs AWS creds CI won't have. */
export const mockPresignedPutUrl = async (page: Page) => {
  await page.route("**/api/trpc/asset.getPresignedPutUrl*", async (route) => {
    const input = route.request().postDataJSON() as {
      json: { fileName: string }
    }
    // Key shape matches asset.service getFileKey. UI reads filename from the
    // last path segment.
    const fileKey = `e2e-mock/${crypto.randomUUID()}/${input.json.fileName}`
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        result: {
          data: {
            json: {
              fileKey,
              uploadConfig: {
                presignedPutUrl: `https://user-content.example.com/${fileKey}`,
                contentType: "image/png",
                contentDisposition: "inline",
              },
            },
          },
        },
      }),
    })
  })
}

/** Clear gbFeaturesCache before navigation. global-setup storage state keeps
 *  login-time flags; without this, route mocks never apply. */
export const resetGrowthBookPage = async (page: Page) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.removeItem("gbFeaturesCache")
    } catch {
      // localStorage may be unavailable (e.g. on about:blank); ignore.
    }
  })
  await page.goto("about:blank")
}

interface GrowthBookFeaturesResponse {
  features: Record<string, { defaultValue?: unknown; rules?: unknown[] }>
}

/** Patch one feature in the CDN /api/features/ response. */
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
