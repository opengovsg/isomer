import { TRPCError } from "@trpc/server"
import { resetTables } from "tests/integration/helpers/db"
import { mockFeatureFlags } from "tests/integration/helpers/growthbook/mockFeatureFlags"
import { mockGrowthBook } from "tests/integration/helpers/growthbook/mockInstance"
import {
  applyAuthedSession,
  applySession,
  createMockRequest,
} from "tests/integration/helpers/iron-session"
import {
  setupEditorPermissions,
  setupPageResource,
} from "tests/integration/helpers/seed"
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest"
import { generateAltText } from "~/lib/generateAltText"
import { ENABLE_AI_ALT_TEXT_GENERATION_FEATURE_KEY } from "~/lib/growthbook"
import { createCallerFactory } from "~/server/trpc"
import { ResourceType } from "~prisma/generated/generatedEnums"

import { aiRouter } from "../ai.router"

vi.mock("~/lib/generateAltText", async () => {
  const actual = await vi.importActual("~/lib/generateAltText")
  return {
    ...actual,
    generateAltText: vi.fn(),
  }
})

const createCaller = createCallerFactory(aiRouter)
const UUID = "11111111-1111-1111-1111-111111111111"
const ASSET_DOMAIN = "user-content.example.com"

const enableAltText = (siteId: number) => {
  mockGrowthBook.setForcedFeatures(
    new Map([
      ...mockFeatureFlags,
      [
        ENABLE_AI_ALT_TEXT_GENERATION_FEATURE_KEY,
        { enabledSites: [String(siteId)] },
      ],
    ]),
  )
}

describe("ai.router", async () => {
  let caller: ReturnType<typeof createCaller>
  const session = await applyAuthedSession()

  beforeAll(() => {
    caller = createCaller(createMockRequest(session))
  })

  beforeEach(async () => {
    await resetTables("Site", "ResourcePermission", "Resource", "IsomerAdmin")
    mockGrowthBook.setForcedFeatures(mockFeatureFlags)
    vi.mocked(generateAltText).mockReset()
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, status: 200 }))
  })

  it("should throw 401 if not logged in", async () => {
    // Arrange
    const unauthedCaller = createCaller(createMockRequest(applySession()))

    // Act
    const result = unauthedCaller.generateAltText({
      siteId: 1,
      pageId: 1,
      src: `/1/${UUID}/picture.png`,
    })

    // Assert
    await expect(result).rejects.toThrow(
      new TRPCError({ code: "UNAUTHORIZED" }),
    )
  })

  it("should throw 403 when alt text generation is disabled", async () => {
    // Arrange
    const { site, page } = await setupPageResource({
      resourceType: ResourceType.Page,
    })
    await setupEditorPermissions({
      siteId: site.id,
      userId: String(session.userId),
    })

    // Act
    const result = caller.generateAltText({
      siteId: site.id,
      pageId: Number(page.id),
      src: `/${site.id}/${UUID}/picture.png`,
    })

    // Assert
    await expect(result).rejects.toThrow(
      new TRPCError({
        code: "FORBIDDEN",
        message: "Alt text suggestions are not available for this site",
      }),
    )
    expect(generateAltText).not.toHaveBeenCalled()
  })

  it("should throw 403 when the user cannot update the page", async () => {
    // Arrange
    const { site, page } = await setupPageResource({
      resourceType: ResourceType.Page,
    })
    enableAltText(site.id)

    // Act
    const result = caller.generateAltText({
      siteId: site.id,
      pageId: Number(page.id),
      src: `/${site.id}/${UUID}/picture.png`,
    })

    // Assert
    await expect(result).rejects.toThrow(
      new TRPCError({
        code: "FORBIDDEN",
        message:
          "You do not have sufficient permissions to perform this action",
      }),
    )
  })

  it("should throw 403 when the image belongs to another site", async () => {
    // Arrange
    const { site, page } = await setupPageResource({
      resourceType: ResourceType.Page,
    })
    enableAltText(site.id)
    const { site: otherSite } = await setupPageResource({
      resourceType: ResourceType.Page,
    })
    await setupEditorPermissions({
      siteId: site.id,
      userId: String(session.userId),
    })

    // Act
    const result = caller.generateAltText({
      siteId: site.id,
      pageId: Number(page.id),
      src: `/${otherSite.id}/${UUID}/picture.png`,
    })

    // Assert
    await expect(result).rejects.toThrow(
      new TRPCError({
        code: "FORBIDDEN",
        message:
          "The file key does not belong to the specified site. You may only access assets for the site you are authorized for.",
      }),
    )
    expect(generateAltText).not.toHaveBeenCalled()
  })

  it("should throw 403 when the image path is not an asset URL", async () => {
    // Arrange
    const { site, page } = await setupPageResource({
      resourceType: ResourceType.Page,
    })
    enableAltText(site.id)
    await setupEditorPermissions({
      siteId: site.id,
      userId: String(session.userId),
    })

    // Act
    const result = caller.generateAltText({
      siteId: site.id,
      pageId: Number(page.id),
      src: "@169.254.169.254/latest/meta-data/",
    })

    // Assert
    await expect(result).rejects.toThrow(
      new TRPCError({
        code: "FORBIDDEN",
        message:
          "The file key does not belong to the specified site. You may only access assets for the site you are authorized for.",
      }),
    )
  })

  it("should return no suggestion for a non-image asset", async () => {
    // Arrange
    const { site, page } = await setupPageResource({
      resourceType: ResourceType.Page,
    })
    enableAltText(site.id)
    await setupEditorPermissions({
      siteId: site.id,
      userId: String(session.userId),
    })

    // Act
    const result = await caller.generateAltText({
      siteId: site.id,
      pageId: Number(page.id),
      src: `/${site.id}/${UUID}/notes.pdf`,
    })

    // Assert
    expect(result).toEqual({ altText: undefined })
    expect(generateAltText).not.toHaveBeenCalled()
  })

  it("should return the suggestion for an image on the page's site", async () => {
    // Arrange
    const { site, page } = await setupPageResource({
      resourceType: ResourceType.Page,
    })
    enableAltText(site.id)
    await setupEditorPermissions({
      siteId: site.id,
      userId: String(session.userId),
    })
    const src = `/${site.id}/${UUID}/picture.png`
    vi.mocked(generateAltText).mockResolvedValue("A red bus at a stop.")

    // Act
    const result = await caller.generateAltText({
      siteId: site.id,
      pageId: Number(page.id),
      src,
    })

    // Assert
    expect(result).toEqual({ altText: "A red bus at a stop." })
    expect(generateAltText).toHaveBeenCalledWith(
      `https://${ASSET_DOMAIN}${src}`,
    )
  })

  it("should throw 403 when the site is not in the canary", async () => {
    // Arrange
    const { site, page } = await setupPageResource({
      resourceType: ResourceType.Page,
    })
    enableAltText(site.id + 1)
    await setupEditorPermissions({
      siteId: site.id,
      userId: String(session.userId),
    })

    // Act
    const result = caller.generateAltText({
      siteId: site.id,
      pageId: Number(page.id),
      src: `/${site.id}/${UUID}/picture.png`,
    })

    // Assert
    await expect(result).rejects.toThrow(
      new TRPCError({
        code: "FORBIDDEN",
        message: "Alt text suggestions are not available for this site",
      }),
    )
    expect(generateAltText).not.toHaveBeenCalled()
  })
})
