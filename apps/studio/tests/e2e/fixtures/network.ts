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

/** Fail `collection.countTagOptionsUsage` so delete warnings fall back to the undo copy. */
export const failTagOptionsUsageCount = async (page: Page) => {
  await page.route("**/api/trpc/**", (route) => {
    const url = route.request().url()
    const postData = route.request().postData() ?? ""
    if (
      url.includes("countTagOptionsUsage") ||
      postData.includes("countTagOptionsUsage")
    ) {
      return route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({
          error: {
            json: {
              message: "usage count failed",
              code: -32003,
              data: {
                code: "FORBIDDEN",
                httpStatus: 403,
                path: "collection.countTagOptionsUsage",
              },
            },
          },
        }),
      })
    }
    return route.continue()
  })
}

const TRPC_UNDEFINED_SUCCESS_BODY = JSON.stringify({
  result: {
    data: {
      json: null,
      meta: {
        values: ["undefined"],
      },
    },
  },
})

const trpcMutationErrorBody = (procedure: string, message: string) =>
  JSON.stringify({
    error: {
      json: {
        message,
        code: -32603,
        data: {
          code: "INTERNAL_SERVER_ERROR",
          httpStatus: 500,
          path: procedure,
        },
      },
    },
  })

/**
 * Stub `site.publish` so godmode publishing E2E can assert toasts without
 * calling AWS CodeBuild (no credentials in the test env).
 *
 * `failTimes` fulfils that many calls with an error, then succeeds.
 */
export const mockGodmodeSitePublish = async (
  page: Page,
  options?: { failTimes?: number; errorMessage?: string },
) => {
  let remainingFailures = options?.failTimes ?? 0
  const errorMessage = options?.errorMessage ?? "CodeBuild unavailable"

  await page.route("**/api/trpc/**", async (route) => {
    const url = route.request().url()
    if (!url.includes("site.publish")) {
      await route.fallback()
      return
    }

    if (remainingFailures > 0) {
      remainingFailures -= 1
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: trpcMutationErrorBody("site.publish", errorMessage),
      })
      return
    }

    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: TRPC_UNDEFINED_SUCCESS_BODY,
    })
  })
}

/** Fail the next `times` calls to a tRPC mutation, then hit the real server. */
export const mockTrpcMutationError = async (
  page: Page,
  procedure: string,
  options: { message: string; times?: number },
) => {
  await page.route(
    `**/api/trpc/${procedure}*`,
    async (route) => {
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: trpcMutationErrorBody(procedure, options.message),
      })
    },
    { times: options.times ?? 1 },
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
