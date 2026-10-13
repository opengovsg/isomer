import type { Page } from "@playwright/test"
import crypto from "crypto"

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

    // Defer to the hostname-specific handler above for GETs to the assets
    // host — route.continue() would instead send them straight to the real
    // (nonexistent) network host, since it never re-checks earlier handlers.
    await route.fallback()
  })
}

/**
 * Intercept the `asset.getPresignedPutUrl` tRPC mutation and fulfil it with a
 * synthetic upload target on the host `mockAssetUploadRoutes` already fakes
 * out. Real presigning calls the AWS SDK's credential provider chain, which
 * needs a live AWS/R2 session or SSO login that isn't available in CI or on
 * a machine with an expired SSO session — so this replaces the server
 * round-trip entirely rather than relying on presigning itself to succeed.
 */
export const mockPresignedPutUrl = async (page: Page) => {
  await page.route("**/api/trpc/asset.getPresignedPutUrl*", async (route) => {
    const input = route.request().postDataJSON() as {
      json: { fileName: string }
    }
    // Mirror the real key shape (server/modules/asset/asset.service.ts
    // getFileKey): the UI reads the uploaded filename back off the last path
    // segment, so it must match what was actually uploaded, not a random one.
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

/** Force `site.updateSiteConfig` to fail so settings Publish error handling can be exercised. */
export const mockSiteUpdateConfigFailure = async (page: Page) => {
  await page.route("**/api/trpc/site.updateSiteConfig*", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({
        error: {
          json: {
            message: "Internal server error",
            code: -32603,
            data: { httpStatus: 500 },
          },
        },
      }),
    }),
  )
}

export const unmockSiteUpdateConfigFailure = async (page: Page) => {
  await page.unroute("**/api/trpc/site.updateSiteConfig*")
}

/** Override the asset CDN handler so S3 PUT fails after presigning succeeds. */
export const mockFailedAssetUpload = async (page: Page) => {
  await page.route(
    (url) => url.hostname === "user-content.example.com",
    (route) =>
      route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({ error: "Upload failed" }),
      }),
  )
}

/**
 * Override one offline GrowthBook flag on the already-loaded page.
 * The test build's client is created by `createOfflineGrowthBook` and does
 * not fetch the CDN.
 */
export const setOfflineGrowthBookFeature = async (
  page: Page,
  featureKey: string,
  value: unknown,
) => {
  await page.evaluate(
    ({ featureKey, value }) => {
      const setFeature = (
        window as Window & {
          __e2eSetGrowthBookFeature?: (key: string, value: unknown) => void
        }
      ).__e2eSetGrowthBookFeature
      if (!setFeature) {
        throw new Error("E2E GrowthBook hook is missing")
      }
      setFeature(featureKey, value)
    },
    { featureKey, value },
  )
}
