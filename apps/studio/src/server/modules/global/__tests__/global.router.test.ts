import type * as S3 from "~/lib/s3"
import { mockGrowthBook } from "tests/integration/helpers/growthbook/mockInstance"
import {
  applyAuthedSession,
  createMockRequest,
} from "tests/integration/helpers/iron-session"
import { setUpWhitelist } from "tests/integration/helpers/seed"
import { vi } from "vitest"
import { MOE_SITES } from "~/constants/misc"
import { IS_CENTRAL_NOTIFICATION_BANNER_ENABLED_FEATURE_KEY } from "~/lib/growthbook"
import {
  applyGrowthBookOverride,
  mockFeatureFlags,
} from "~/lib/growthbookOffline"
import { getTextObject, putObjectDirect } from "~/lib/s3"
import { createCallerFactory } from "~/server/trpc"

import { globalRouter } from "../global.router"

vi.mock("~/lib/s3", async (importOriginal) => ({
  ...(await importOriginal<typeof S3>()),
  getTextObject: vi.fn(),
  putObjectDirect: vi.fn(),
}))

const createCaller = createCallerFactory(globalRouter)

const NOTIFICATION = { title: "Haze advisory" }
const ETAG = '"abc123"'
const HTTP_PRECONDITION_FAILED = 412

describe("global.router", async () => {
  let caller: ReturnType<typeof createCaller>
  const session = await applyAuthedSession()

  beforeAll(() => {
    caller = createCaller(createMockRequest(session))
  })

  beforeEach(async () => {
    await setUpWhitelist({ email: "test@open.gov.sg" })
    vi.clearAllMocks()
    vi.mocked(putObjectDirect).mockResolvedValue(undefined)
    applyGrowthBookOverride(
      mockGrowthBook,
      IS_CENTRAL_NOTIFICATION_BANNER_ENABLED_FEATURE_KEY,
      true,
    )
  })

  afterEach(() => {
    mockGrowthBook.setForcedFeatures(mockFeatureFlags)
  })

  describe("getNotification", () => {
    it("returns the first entry and its version", async () => {
      // Arrange
      vi.mocked(getTextObject).mockResolvedValue({
        body: JSON.stringify([
          { notification: NOTIFICATION, targetSites: MOE_SITES },
        ]),
        eTag: ETAG,
      })

      // Act
      const result = await caller.getNotification()

      // Assert
      // Validation fills in the schema default `type`
      expect(result).toEqual({
        notification: { ...NOTIFICATION, type: "custom" },
        version: ETAG,
      })
    })

    it("returns an empty state when nothing is published yet", async () => {
      // Arrange
      vi.mocked(getTextObject).mockResolvedValue(null)

      // Act
      const result = await caller.getNotification()

      // Assert
      expect(result).toEqual({ notification: null, version: null })
    })

    it("rejects a user without the feature flag before reading S3", async () => {
      // Arrange
      applyGrowthBookOverride(
        mockGrowthBook,
        IS_CENTRAL_NOTIFICATION_BANNER_ENABLED_FEATURE_KEY,
        false,
      )

      // Act
      const result = caller.getNotification()

      // Assert
      await expect(result).rejects.toMatchObject({ code: "FORBIDDEN" })
      expect(getTextObject).not.toHaveBeenCalled()
    })

    it.each([
      ["invalid JSON", "{"],
      ["a non-array body", JSON.stringify({ notification: NOTIFICATION })],
      [
        "an entry without targets",
        JSON.stringify([{ notification: NOTIFICATION }]),
      ],
    ])("returns INTERNAL_SERVER_ERROR for %s", async (_, body) => {
      // Arrange
      vi.mocked(getTextObject).mockResolvedValue({ body, eTag: ETAG })

      // Act
      const result = caller.getNotification()

      // Assert
      await expect(result).rejects.toMatchObject({
        code: "INTERNAL_SERVER_ERROR",
      })
    })
  })

  describe("setNotification", () => {
    it("publishes to MOE sites conditioned on the loaded version", async () => {
      // Act
      await caller.setNotification({
        notification: NOTIFICATION,
        version: ETAG,
      })

      // Assert
      expect(putObjectDirect).toHaveBeenCalledWith(
        expect.objectContaining({
          Body: JSON.stringify([
            { notification: NOTIFICATION, targetSites: MOE_SITES },
          ]),
          IfMatch: ETAG,
        }),
      )
    })

    it("only creates the file when no version was loaded", async () => {
      // Act
      await caller.setNotification({ notification: null, version: null })

      // Assert
      expect(putObjectDirect).toHaveBeenCalledWith(
        expect.objectContaining({ Body: "[]", IfNoneMatch: "*" }),
      )
    })

    it("returns CONFLICT when someone else published first", async () => {
      // Arrange
      vi.mocked(putObjectDirect).mockRejectedValue(
        Object.assign(new Error("PreconditionFailed"), {
          $metadata: { httpStatusCode: HTTP_PRECONDITION_FAILED },
        }),
      )

      // Act
      const result = caller.setNotification({
        notification: NOTIFICATION,
        version: ETAG,
      })

      // Assert
      await expect(result).rejects.toMatchObject({ code: "CONFLICT" })
    })

    it("rejects content the site cannot render", async () => {
      // Act
      const result = caller.setNotification({
        notification: { title: "Notice", content: {} } as never,
        version: ETAG,
      })

      // Assert
      await expect(result).rejects.toMatchObject({ code: "BAD_REQUEST" })
      expect(putObjectDirect).not.toHaveBeenCalled()
    })

    it("rejects internal links, which sites cannot resolve", async () => {
      // Act
      const result = caller.setNotification({
        notification: {
          title: "Notice",
          content: [
            {
              type: "text",
              text: "our page",
              marks: [{ type: "link", attrs: { href: "[resource:1:2]" } }],
            },
          ],
        },
        version: ETAG,
      })

      // Assert
      await expect(result).rejects.toMatchObject({ code: "BAD_REQUEST" })
      expect(putObjectDirect).not.toHaveBeenCalled()
    })

    it("accepts web and email links", async () => {
      // Act
      await caller.setNotification({
        notification: {
          title: "Notice",
          content: [
            {
              type: "text",
              text: "haze.gov.sg",
              marks: [
                { type: "link", attrs: { href: "https://www.haze.gov.sg" } },
              ],
            },
            {
              type: "text",
              text: "email us",
              marks: [
                { type: "link", attrs: { href: "mailto:help@example.gov.sg" } },
              ],
            },
          ],
        },
        version: ETAG,
      })

      // Assert
      expect(putObjectDirect).toHaveBeenCalledOnce()
    })

    it("rejects a user without the feature flag before writing S3", async () => {
      // Arrange
      applyGrowthBookOverride(
        mockGrowthBook,
        IS_CENTRAL_NOTIFICATION_BANNER_ENABLED_FEATURE_KEY,
        false,
      )

      // Act
      const result = caller.setNotification({
        notification: NOTIFICATION,
        version: ETAG,
      })

      // Assert
      await expect(result).rejects.toMatchObject({ code: "FORBIDDEN" })
      expect(putObjectDirect).not.toHaveBeenCalled()
    })
  })
})
