import type { IsomerSchema } from "@opengovsg/isomer-components"
import type { z } from "zod"
import type { reorderBlobSchema, updatePageBlobSchema } from "~/schemas/page"
import { TRPCError } from "@trpc/server"
import { addDays, set, subDays } from "date-fns"
import { omit, pick } from "lodash-es"
import MockDate from "mockdate"
import { auth } from "tests/integration/helpers/auth"
import { resetTables } from "tests/integration/helpers/db"
import {
  applyAuthedSession,
  applySession,
  createMockRequest,
} from "tests/integration/helpers/iron-session"
import {
  setupAdminPermissions,
  setupCollection,
  setupEditorPermissions,
  setupFolder,
  setupPageResource,
  setupPublisherPermissions,
  setupSite,
  setupUser,
} from "tests/integration/helpers/seed"
import { normalizeRedirectPath } from "~/schemas/redirect"
import { createCallerFactory } from "~/server/trpc"
import {
  AuditLogEvent,
  ResourceState,
  ResourceType,
} from "~prisma/generated/generatedEnums"

import type { User } from "../../database/types"
import { assertAuditLogRows } from "../../audit/__tests__/utils"
import { db } from "../../database/database"
import { jsonb } from "../../database/utils"
import {
  getBlobOfResource,
  getPageById,
  getResourceFullPermalink,
} from "../../resource/resource.service"
import { pageRouter } from "../page.router"
import { createDefaultPage } from "../page.service"

const createCaller = createCallerFactory(pageRouter)

interface RedirectDeleteAuditDelta {
  before: { destination: string; deletedAt: string | null }
  after: { destination: string; deletedAt: string | null }
}

interface RedirectCreateAuditDelta {
  before: null
  after: { destination: string }
}

const asRedirectDeleteAuditDelta = (
  delta: PrismaJson.AuditLogDeltaJsonContent,
): RedirectDeleteAuditDelta =>
  // SAFETY: audit log row was written by redirect retirement in the same test.
  delta as RedirectDeleteAuditDelta

const asRedirectCreateAuditDelta = (
  delta: PrismaJson.AuditLogDeltaJsonContent,
): RedirectCreateAuditDelta =>
  // SAFETY: audit log row was written by redirect adoption in the same test.
  delta as RedirectCreateAuditDelta

describe("page.router", async () => {
  let caller: ReturnType<typeof createCaller>
  const session = await applyAuthedSession()
  let user: User

  beforeEach(async () => {
    await resetTables(
      "AuditLog",
      "ResourcePermission",
      "Blob",
      "Version",
      "Resource",
      "Site",
      "User",
    )
    caller = createCaller(createMockRequest(session))
    user = await setupUser({
      email: "test@mock.com",
      isDeleted: false,
      userId: session.userId ?? undefined,
    })
    await auth(user)
  })

  describe("getPrefill", () => {
    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      const result = unauthedCaller.getPrefill({ resourceId: "1", siteId: 1 })

      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have read access to the site", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
      })

      // Act
      const result = caller.getPrefill({
        resourceId: page.id,
        siteId: site.id,
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

    it("should throw 404 if resource does not exist", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = caller.getPrefill({
        resourceId: "99999",
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "NOT_FOUND", message: "Resource not found" }),
      )
    })

    it("should return prefill data for article page layout", async () => {
      // Arrange
      const articleBlob = await db
        .insertInto("Blob")
        .values({
          content: jsonb({
            content: [],
            layout: "article",
            page: {
              articlePageHeader: { summary: "Article summary text" },
              image: { alt: "Article image", src: "/images/article-thumb.jpg" },
            },
            version: "0.1.0",
          }),
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      const { site } = await setupSite()
      const page = await db
        .insertInto("Resource")
        .values({
          draftBlobId: articleBlob.id,
          permalink: "test-article",
          siteId: site.id,
          title: "Test Article Page",
          type: ResourceType.Page,
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = await caller.getPrefill({
        resourceId: page.id,
        siteId: site.id,
      })

      // Assert
      expect(result).toEqual({
        description: "Article summary text",
        thumbnail: "/images/article-thumb.jpg",
        thumbnailAlt: "Article image",
        title: "Test Article Page",
      })
    })

    it("should return prefill data for content page layout", async () => {
      // Arrange
      const contentBlob = await db
        .insertInto("Blob")
        .values({
          content: jsonb({
            content: [],
            layout: "content",
            page: {
              contentPageHeader: { summary: "Content page summary" },
              image: { alt: "Content image", src: "/images/content-thumb.png" },
            },
            version: "0.1.0",
          }),
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      const { site } = await setupSite()
      const page = await db
        .insertInto("Resource")
        .values({
          draftBlobId: contentBlob.id,
          permalink: "test-content",
          siteId: site.id,
          title: "Test Content Page",
          type: ResourceType.Page,
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = await caller.getPrefill({
        resourceId: page.id,
        siteId: site.id,
      })

      // Assert
      expect(result).toEqual({
        description: "Content page summary",
        thumbnail: "/images/content-thumb.png",
        thumbnailAlt: "Content image",
        title: "Test Content Page",
      })
    })

    it("should return prefill data for index page layout", async () => {
      // Arrange
      const indexBlob = await db
        .insertInto("Blob")
        .values({
          content: jsonb({
            content: [],
            layout: "index",
            page: {
              contentPageHeader: { summary: "Index page summary" },
              image: { alt: "Index image", src: "/images/index-thumb.png" },
            },
            version: "0.1.0",
          }),
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      const { site } = await setupSite()
      const page = await db
        .insertInto("Resource")
        .values({
          draftBlobId: indexBlob.id,
          permalink: "_index",
          siteId: site.id,
          title: "Test Index Page",
          type: ResourceType.IndexPage,
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = await caller.getPrefill({
        resourceId: page.id,
        siteId: site.id,
      })

      // Assert
      expect(result).toEqual({
        description: "Index page summary",
        thumbnail: "/images/index-thumb.png",
        thumbnailAlt: "Index image",
        title: "Test Index Page",
      })
    })

    it("should return prefill data for database page layout", async () => {
      // Arrange
      const databaseBlob = await db
        .insertInto("Blob")
        .values({
          content: jsonb({
            content: [],
            layout: "database",
            page: {
              contentPageHeader: { summary: "Database page description" },
            },
            version: "0.1.0",
          }),
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      const { site } = await setupSite()
      const page = await db
        .insertInto("Resource")
        .values({
          draftBlobId: databaseBlob.id,
          permalink: "test-database",
          siteId: site.id,
          title: "Test Database Page",
          type: ResourceType.Page,
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = await caller.getPrefill({
        resourceId: page.id,
        siteId: site.id,
      })

      // Assert
      expect(result).toEqual({
        description: "Database page description",
        title: "Test Database Page",
      })
    })

    it("should return prefill data for collection page layout", async () => {
      // Arrange
      const collectionBlob = await db
        .insertInto("Blob")
        .values({
          content: jsonb({
            content: [],
            layout: "collection",
            page: {
              subtitle: "Collection subtitle text",
            },
            version: "0.1.0",
          }),
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      const { site } = await setupSite()
      const page = await db
        .insertInto("Resource")
        .values({
          draftBlobId: collectionBlob.id,
          permalink: "test-collection",
          siteId: site.id,
          title: "Test Collection Page",
          type: ResourceType.IndexPage,
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = await caller.getPrefill({
        resourceId: page.id,
        siteId: site.id,
      })

      // Assert
      expect(result).toEqual({
        description: "Collection subtitle text",
        title: "Test Collection Page",
      })
    })

    it("should return prefill data for file ref page layout", async () => {
      // Arrange
      const fileBlob = await db
        .insertInto("Blob")
        .values({
          content: jsonb({
            content: [],
            layout: "file",
            page: {
              description: "File description text",
              image: { alt: "File image", src: "/images/file-thumb.png" },
            },
            version: "0.1.0",
          }),
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      const { site } = await setupSite()
      const page = await db
        .insertInto("Resource")
        .values({
          draftBlobId: fileBlob.id,
          permalink: "test-file",
          siteId: site.id,
          title: "Test File Page",
          type: ResourceType.Page,
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = await caller.getPrefill({
        resourceId: page.id,
        siteId: site.id,
      })

      // Assert
      expect(result).toEqual({
        description: "File description text",
        thumbnail: "/images/file-thumb.png",
        thumbnailAlt: "File image",
        title: "Test File Page",
      })
    })

    it("should return prefill data for link ref page layout", async () => {
      // Arrange
      const linkBlob = await db
        .insertInto("Blob")
        .values({
          content: jsonb({
            content: [],
            layout: "link",
            page: {
              description: "Link description text",
              image: { alt: "Link image", src: "/images/link-thumb.png" },
            },
            version: "0.1.0",
          }),
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      const { site } = await setupSite()
      const page = await db
        .insertInto("Resource")
        .values({
          draftBlobId: linkBlob.id,
          permalink: "test-link",
          siteId: site.id,
          title: "Test Link Page",
          type: ResourceType.Page,
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = await caller.getPrefill({
        resourceId: page.id,
        siteId: site.id,
      })

      // Assert
      expect(result).toEqual({
        description: "Link description text",
        thumbnail: "/images/link-thumb.png",
        thumbnailAlt: "Link image",
        title: "Test Link Page",
      })
    })

    it("should return only title for homepage layout", async () => {
      // Arrange
      const homepageBlob = await db
        .insertInto("Blob")
        .values({
          content: jsonb({
            content: [],
            layout: "homepage",
            page: {},
            version: "0.1.0",
          }),
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      const { site } = await setupSite()
      const page = await db
        .insertInto("Resource")
        .values({
          draftBlobId: homepageBlob.id,
          permalink: "",
          siteId: site.id,
          title: "Homepage",
          type: ResourceType.RootPage,
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = await caller.getPrefill({
        resourceId: page.id,
        siteId: site.id,
      })

      // Assert
      expect(result).toEqual({
        title: "Homepage",
      })
    })

    it("should handle missing optional fields gracefully", async () => {
      // Arrange - article page without image
      const articleBlob = await db
        .insertInto("Blob")
        .values({
          content: jsonb({
            content: [],
            layout: "article",
            page: {
              articlePageHeader: { summary: "Article without image" },
            },
            version: "0.1.0",
          }),
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      const { site } = await setupSite()
      const page = await db
        .insertInto("Resource")
        .values({
          draftBlobId: articleBlob.id,
          permalink: "article-no-image",
          siteId: site.id,
          title: "Article Without Image",
          type: ResourceType.Page,
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = await caller.getPrefill({
        resourceId: page.id,
        siteId: site.id,
      })

      // Assert
      expect(result).toEqual({
        description: "Article without image",
        thumbnail: undefined,
        thumbnailAlt: undefined,
        title: "Article Without Image",
      })
    })

    it("should resolve Collection resource to its IndexPage", async () => {
      // Arrange
      const { site, collection } = await setupCollection()

      // Create an IndexPage for the collection with specific content
      const indexBlob = await db
        .insertInto("Blob")
        .values({
          content: jsonb({
            content: [],
            layout: "collection",
            page: {
              subtitle: "Collection index page subtitle",
            },
            version: "0.1.0",
          }),
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      await db
        .insertInto("Resource")
        .values({
          draftBlobId: indexBlob.id,
          parentId: collection.id,
          permalink: "_index",
          siteId: site.id,
          title: "Collection Index",
          type: ResourceType.IndexPage,
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act - request prefill for the Collection resource
      const result = await caller.getPrefill({
        resourceId: collection.id,
        siteId: site.id,
      })

      // Assert - should get data from the IndexPage
      expect(result).toEqual({
        description: "Collection index page subtitle",
        title: "Collection Index",
      })
    })

    it("should resolve Folder resource to its IndexPage", async () => {
      // Arrange
      const { site, folder } = await setupFolder()

      // Create an IndexPage for the folder with specific content
      const indexBlob = await db
        .insertInto("Blob")
        .values({
          content: jsonb({
            content: [],
            layout: "index",
            page: {
              contentPageHeader: { summary: "Folder index summary" },
              image: { alt: "Folder", src: "/images/folder-index.png" },
            },
            version: "0.1.0",
          }),
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      await db
        .insertInto("Resource")
        .values({
          draftBlobId: indexBlob.id,
          parentId: folder.id,
          permalink: "_index",
          siteId: site.id,
          title: "Folder Index Page",
          type: ResourceType.IndexPage,
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act - request prefill for the Folder resource
      const result = await caller.getPrefill({
        resourceId: folder.id,
        siteId: site.id,
      })

      // Assert - should get data from the IndexPage
      expect(result).toEqual({
        description: "Folder index summary",
        thumbnail: "/images/folder-index.png",
        thumbnailAlt: "Folder",
        title: "Folder Index Page",
      })
    })
  })

  describe("list", () => {
    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      const result = unauthedCaller.list({ siteId: 1 })

      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have read access to the site", async () => {
      // Arrange
      const { site } = await setupSite()

      const result = caller.list({ siteId: site.id })

      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it("should return 200", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = await caller.list({ siteId: site.id })

      // Assert
      expect(result).toEqual([])
    })
  })

  describe("getCategories", () => {
    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      const result = unauthedCaller.getCategories({ pageId: 1, siteId: 1 })

      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have read access to the site", async () => {
      // Arrange
      const { page, site } = await setupPageResource({
        resourceType: ResourceType.CollectionPage,
      })

      // Act
      const result = caller.getCategories({
        pageId: Number(page.id),
        siteId: site.id,
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

    it("should return 200", async () => {
      // Arrange
      const { collection, site } = await setupCollection()
      const { page } = await setupPageResource({
        parentId: collection.id,
        resourceType: ResourceType.CollectionPage,
        siteId: site.id,
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = await caller.getCategories({
        pageId: Number(page.id),
        siteId: site.id,
      })

      // Assert
      expect(result).toBeDefined()
    })
  })

  describe("readPage", () => {
    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      const result = unauthedCaller.readPage({ pageId: 1, siteId: 1 })

      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return 404 if page does not exist", async () => {
      // Act
      const mockSite = { pageId: 1, siteId: 1 }
      const site = await setupSite(mockSite.siteId)
      await setupAdminPermissions({
        siteId: site.site.id,
        userId: session.userId ?? undefined,
      })
      const result = caller.readPage(mockSite)

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "NOT_FOUND", message: "Resource not found" }),
      )
    })

    it("should return the resource if resource type is Page and exists", async () => {
      // Arrange
      const { site, page: expectedPage } = await setupPageResource({
        resourceType: "Page",
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = await caller.readPage({
        pageId: Number(expectedPage.id),
        siteId: site.id,
      })

      // Assert
      expect(result.siteId).toEqual(site.id)
      expect(result.type).toEqual("Page")
      expect(result).toMatchObject(expectedPage)
    })

    it("should return the resource if resource type is CollectionPage and exists", async () => {
      // Arrange
      const { site, page: expectedPage } = await setupPageResource({
        resourceType: "CollectionPage",
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = await caller.readPage({
        pageId: Number(expectedPage.id),
        siteId: site.id,
      })

      // Assert
      expect(result.siteId).toEqual(site.id)
      expect(result.type).toEqual("CollectionPage")
      expect(result).toMatchObject(expectedPage)
    })

    it("should return the resource if resource type is RootPage and exists", async () => {
      // Arrange
      const { site, page: expectedPage } = await setupPageResource({
        resourceType: "RootPage",
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = await caller.readPage({
        pageId: Number(expectedPage.id),
        siteId: site.id,
      })

      // Assert
      expect(result.siteId).toEqual(site.id)
      expect(result.type).toEqual("RootPage")
      expect(result).toMatchObject(expectedPage)
    })

    it("should return 404 if resource type is not a page", async () => {
      // Arrange
      const { site, folder } = await setupFolder()
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = caller.readPage({
        pageId: Number(folder.id),
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "NOT_FOUND", message: "Resource not found" }),
      )
    })

    it("should throw 403 if user does not have read access to the page", async () => {
      // Arrange
      const { site, page: expectedPage } = await setupPageResource({
        resourceType: "CollectionPage",
      })

      // Act
      const result = caller.readPage({
        pageId: Number(expectedPage.id),
        siteId: site.id,
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
  })

  describe("readPageAndBlob", () => {
    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      const result = unauthedCaller.readPageAndBlob({ pageId: 1, siteId: 1 })

      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have read access to the page", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
      })

      // Act
      const result = caller.readPageAndBlob({
        pageId: Number(page.id),
        siteId: site.id,
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

    it("should return 404 if page does not exist", async () => {
      const mockSite = { pageId: 1, siteId: 1 }
      const site = await setupSite(mockSite.siteId)
      await setupEditorPermissions({
        siteId: site.site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = caller.readPageAndBlob(mockSite)

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "NOT_FOUND", message: "Resource not found" }),
      )
    })

    it("should return the resource if resource type is Page and exists", async () => {
      // Arrange
      const { site, page, blob, navbar, footer } = await setupPageResource({
        resourceType: "Page",
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })
      const expected = {
        ...pick(page, ["permalink", "title", "type"]),
        content: blob.content,
        footer: omit(footer, ["createdAt", "updatedAt"]),
        navbar: omit(navbar, ["createdAt", "updatedAt"]),
      }

      // Act
      const result = await caller.readPageAndBlob({
        pageId: Number(page.id),
        siteId: site.id,
      })

      // Assert
      expect(result.type).toEqual("Page")
      expect(result).toMatchObject(expected)
    })

    it("should return the resource if resource type is RootPage and exists", async () => {
      // Arrange
      const { site, page, blob, navbar, footer } = await setupPageResource({
        resourceType: "RootPage",
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })
      const expected = {
        ...pick(page, ["permalink", "title", "type"]),
        content: blob.content,
        footer: omit(footer, ["createdAt", "updatedAt"]),
        navbar: omit(navbar, ["createdAt", "updatedAt"]),
      }

      // Act
      const result = await caller.readPageAndBlob({
        pageId: Number(page.id),
        siteId: site.id,
      })

      // Assert
      expect(result.type).toEqual("RootPage")
      expect(result).toMatchObject(expected)
    })

    it("should return the resource if resource type is CollectionPage and exists", async () => {
      // Arrange
      const { site, page, blob, navbar, footer } = await setupPageResource({
        resourceType: "CollectionPage",
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })
      const expected = {
        ...pick(page, ["permalink", "title", "type"]),
        content: blob.content,
        footer: omit(footer, ["createdAt", "updatedAt"]),
        navbar: omit(navbar, ["createdAt", "updatedAt"]),
      }

      // Act
      const result = await caller.readPageAndBlob({
        pageId: Number(page.id),
        siteId: site.id,
      })

      // Assert
      expect(result.type).toEqual("CollectionPage")
      expect(result).toMatchObject(expected)
    })

    it("should return the resource if resource type is FolderMeta and exists", async () => {
      // Arrange
      const { site, page, blob, navbar, footer } = await setupPageResource({
        resourceType: "FolderMeta",
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })
      const expected = {
        ...pick(page, ["permalink", "title", "type"]),
        content: blob.content,
        footer: omit(footer, ["createdAt", "updatedAt"]),
        navbar: omit(navbar, ["createdAt", "updatedAt"]),
      }

      // Act
      const result = await caller.readPageAndBlob({
        pageId: Number(page.id),
        siteId: site.id,
      })

      // Assert
      expect(result.type).toEqual("FolderMeta")
      expect(result).toMatchObject(expected)
    })

    it("should return 404 if resource type is not a page", async () => {
      // Arrange
      const { site, folder } = await setupFolder()
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = caller.readPageAndBlob({
        pageId: Number(folder.id),
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "NOT_FOUND", message: "Resource not found" }),
      )
    })
  })

  describe("reorderBlock", () => {
    let pageToReorder: Awaited<ReturnType<typeof setupPageResource>>

    beforeEach(async () => {
      pageToReorder = await setupPageResource({ resourceType: "Page" })
    })

    it("should throw 401 if not logged in reorder", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      const result = unauthedCaller.reorderBlock({
        blocks: pageToReorder.blob.content.content,
        from: 0,
        pageId: 1,
        siteId: 1,
        to: 1,
      })

      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
      await assertAuditLogRows()
    })

    it("should throw 403 if user does not have update access to the page", async () => {
      // Act
      const result = caller.reorderBlock({
        blocks: pageToReorder.blob.content.content,
        from: 0,
        pageId: Number(pageToReorder.page.id),
        siteId: pageToReorder.site.id,
        to: 1,
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

    it("should return 404 if page does not exist", async () => {
      //Arrange
      await setupAdminPermissions({
        siteId: pageToReorder.site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = caller.reorderBlock({
        blocks: pageToReorder.blob.content.content,
        from: 0,
        pageId: 999_999,
        // should not exist
        siteId: pageToReorder.site.id,
        to: 1,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message:
            "Unable to load content for the requested page, please contact Isomer Support",
        }),
      )
    })

    it("should return 409 if block arg does not match current state", async () => {
      // Arrange
      const unexpectedBlock: z.input<typeof reorderBlobSchema>["blocks"] = [
        {
          content: [
            {
              type: "paragraph",
              content: [
                {
                  text: "Test block that does not match current blocks",
                  type: "text",
                },
              ],
            },
          ],
          type: "prose",
        },
      ]
      expect(unexpectedBlock).not.toEqual(pageToReorder.blob.content.content)
      await setupAdminPermissions({
        siteId: pageToReorder.site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = caller.reorderBlock({
        blocks: unexpectedBlock,
        from: 0,
        pageId: Number(pageToReorder.page.id),
        siteId: pageToReorder.site.id,
        to: 1,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "CONFLICT",
          message:
            "Someone on your team has changed this page, refresh the page and try again",
        }),
      )
      await assertAuditLogRows()
    })

    it("should return 422 if `from` arg is out of bounds", async () => {
      // Arrange
      const fromArg = pageToReorder.blob.content.content.length + 10
      await setupAdminPermissions({
        siteId: pageToReorder.site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = caller.reorderBlock({
        blocks: pageToReorder.blob.content.content,
        from: fromArg,
        // should not exist
        pageId: Number(pageToReorder.page.id),
        siteId: pageToReorder.site.id,
        to: 1,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNPROCESSABLE_CONTENT" }),
      )
      await assertAuditLogRows()
    })

    it("should fail validation if `from` arg is negative index", async () => {
      //Arrange
      await setupAdminPermissions({
        siteId: pageToReorder.site.id,
        userId: session.userId ?? undefined,
      })

      // Act & Assert
      await expect(
        caller.reorderBlock({
          blocks: pageToReorder.blob.content.content,
          from: -1,
          pageId: Number(pageToReorder.page.id),
          siteId: pageToReorder.site.id,
          to: 1,
        }),
      ).rejects.toThrow("Too small: expected number to be >=0")
      await assertAuditLogRows()
    })

    it("should return 422 if `to` arg is out of bounds", async () => {
      // Arrange
      const toArg = pageToReorder.blob.content.content.length + 10
      await setupAdminPermissions({
        siteId: pageToReorder.site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = caller.reorderBlock({
        blocks: pageToReorder.blob.content.content,
        from: 1,
        pageId: Number(pageToReorder.page.id),
        siteId: pageToReorder.site.id,
        to: toArg,
        // should not exist,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNPROCESSABLE_CONTENT" }),
      )
      await assertAuditLogRows()
    })

    it("should fail validation if `to` arg is negative index", async () => {
      // Arrange
      await setupAdminPermissions({
        siteId: pageToReorder.site.id,
        userId: session.userId ?? undefined,
      })

      // Act & Assert
      await expect(
        caller.reorderBlock({
          blocks: pageToReorder.blob.content.content,
          from: 1,
          pageId: Number(pageToReorder.page.id),
          siteId: pageToReorder.site.id,
          to: -1,
        }),
      ).rejects.toThrow("Too small: expected number to be >=0")
      await assertAuditLogRows()
    })

    it("should reorder block if args are valid", async () => {
      // Arrange
      await setupAdminPermissions({
        siteId: pageToReorder.site.id,
        userId: session.userId ?? undefined,
      })
      const oldBlob = db
        .selectFrom("Blob")
        .where("id", "=", pageToReorder.blob.id)
        .executeTakeFirstOrThrow()

      // Act
      const result = await caller.reorderBlock({
        blocks: pageToReorder.blob.content.content,
        from: 0,
        pageId: Number(pageToReorder.page.id),
        siteId: pageToReorder.site.id,
        to: 1,
      })

      // Assert
      const actual = await db
        .selectFrom("Blob")
        .where("id", "=", pageToReorder.blob.id)
        .select("content")
        .executeTakeFirstOrThrow()
      const expectedBlocks = pageToReorder.blob.content.content.toReversed()
      expect(actual.content.content).toEqual(expectedBlocks)
      expect(result).toEqual(expectedBlocks)
      await assertAuditLogRows(1)
      const auditLog = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLog[0]).toMatchObject({
        delta: {
          after: {
            blob: actual,
            resource: omit(pageToReorder.page, ["updatedAt", "createdAt"]),
          },
          before: {
            blob: oldBlob,
            resource: omit(pageToReorder.page, ["updatedAt", "createdAt"]),
          },
        },
        eventType: "ResourceUpdate",
      })
    })
  })

  describe("updatePageBlob", () => {
    const NEW_PAGE_BLOCKS: IsomerSchema["content"] = [
      {
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "This is the new block" }],
          },
        ],
        type: "prose",
      },
      {
        content: {
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Test Callout content" }],
            },
          ],
          type: "prose",
        },
        type: "callout",
      },
    ]

    type Page = Awaited<ReturnType<typeof setupPageResource>>["page"]
    let pageToUpdate: Page
    type UpdatePageOutput = z.output<typeof updatePageBlobSchema>
    const createPageUpdateArgs = (page: Page) => ({
      pageId: Number(page.id),
      siteId: page.siteId,
      content: JSON.stringify({
        content: NEW_PAGE_BLOCKS,
        layout: "content",
        page: pick(page, ["title", "permalink"]),
        version: "0.1.0",
      } satisfies UpdatePageOutput["content"]),
    })

    beforeEach(async () => {
      const { page } = await setupPageResource({ resourceType: "Page" })
      pageToUpdate = page
    })

    it("should throw 401 if not logged in update", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))
      const pageUpdateArgs = createPageUpdateArgs(pageToUpdate)

      // Act
      const result = unauthedCaller.updatePageBlob(pageUpdateArgs)

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
      await assertAuditLogRows()
    })

    it("should throw 403 if user does not have update access to the page", async () => {
      // Arrange
      const pageUpdateArgs = createPageUpdateArgs(pageToUpdate)

      // Act
      const result = caller.updatePageBlob(pageUpdateArgs)

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it("should return 404 if page does not exist", async () => {
      // Arrange
      const pageUpdateArgs = createPageUpdateArgs(pageToUpdate)
      await setupAdminPermissions({
        siteId: pageToUpdate.siteId,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = caller.updatePageBlob({
        ...pageUpdateArgs,
        pageId: 999_999,
        // should not exist
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "NOT_FOUND", message: "Resource not found" }),
      )
      await assertAuditLogRows()
    })

    it("should return 422 if content is not valid", async () => {
      // Arrange
      const pageUpdateArgs = createPageUpdateArgs(pageToUpdate)
      await setupAdminPermissions({
        siteId: pageToUpdate.siteId,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = caller.updatePageBlob({
        ...pageUpdateArgs,
        content: "do not match the shape",
      })

      // Assert
      await expect(result).rejects.toThrow("Schema validation failed")
      await assertAuditLogRows()
    })

    it("should update draft page blob if args are valid and has current draft", async () => {
      // Arrange
      const pageUpdateArgs = createPageUpdateArgs(pageToUpdate)
      await setupAdminPermissions({
        siteId: pageToUpdate.siteId,
        userId: session.userId ?? undefined,
      })
      const oldBlob = await db
        .transaction()
        .execute(
          async (tx) =>
            await getBlobOfResource({ db: tx, resourceId: pageToUpdate.id }),
        )

      // Act
      const result = await caller.updatePageBlob(pageUpdateArgs)

      // Assert
      await assertAuditLogRows(1)
      const actual = await db
        .selectFrom("Blob")
        .where("id", "=", pageToUpdate.draftBlobId)
        .select("content")
        .executeTakeFirstOrThrow()
      expect(actual.content).toEqual(result.content)
      const auditLog = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLog[0]).toMatchObject({
        delta: {
          after: {
            blob: omit(actual, ["publishedVersionId", "draftBlobId"]),
            resource: omit(pageToUpdate, ["updatedAt", "createdAt"]),
          },
          before: {
            blob: omit(oldBlob, ["updatedAt", "createdAt"]),
            resource: omit(pageToUpdate, ["updatedAt", "createdAt"]),
          },
        },
        eventType: "ResourceUpdate",
      })
    })

    it("should create draft page blob if args are valid and without current draft", async () => {
      // Arrange
      const { page: publishedPageToUpdate } = await setupPageResource({
        resourceType: "Page",
        state: ResourceState.Published,
        userId: session.userId,
      })
      await setupAdminPermissions({
        siteId: publishedPageToUpdate.siteId,
        userId: session.userId ?? undefined,
      })
      expect(publishedPageToUpdate.publishedVersionId).not.toBeNull()
      expect(publishedPageToUpdate.draftBlobId).toBeNull()
      const pageUpdateArgs = createPageUpdateArgs(publishedPageToUpdate)
      const oldBlob = await db
        .transaction()
        .execute(
          async (tx) =>
            await getBlobOfResource({
              db: tx,
              resourceId: publishedPageToUpdate.id,
            }),
        )

      // Act
      const result = await caller.updatePageBlob(pageUpdateArgs)

      // Assert
      const actual = await db
        .selectFrom("Blob")
        .innerJoin("Resource", "Resource.draftBlobId", "Blob.id")
        .where("Resource.id", "=", publishedPageToUpdate.id)
        .select([
          "Blob.content",
          "Resource.publishedVersionId",
          "Resource.draftBlobId",
        ])
        .executeTakeFirstOrThrow()
      expect(actual).toMatchObject({
        content: result.content,
        draftBlobId: expect.any(String),
        publishedVersionId: publishedPageToUpdate.publishedVersionId,
      })
      await assertAuditLogRows(1)
      const auditLog = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLog[0]).toMatchObject({
        delta: {
          after: {
            blob: omit(actual, ["publishedVersionId", "draftBlobId"]),
            resource: omit(publishedPageToUpdate, ["updatedAt", "createdAt"]),
          },
          before: {
            blob: omit(oldBlob, ["updatedAt", "createdAt"]),
            resource: omit(publishedPageToUpdate, ["updatedAt", "createdAt"]),
          },
        },
        eventType: "ResourceUpdate",
      })
    })
  })

  describe("createPage", () => {
    it("should throw 401 if not logged in create", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.createPage({
        layout: "content",
        permalink: "test-page",
        siteId: 1,
        title: "Test Page",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
      await assertAuditLogRows()
    })

    it("should throw 403 if user does not have create access to the site", async () => {
      // Arrange
      const { site } = await setupSite()
      const expectedPageArgs = {
        permalink: "test-page",
        siteId: site.id,
        title: "Test Page",
      }

      // Act
      const result = caller.createPage({
        ...expectedPageArgs,
        layout: "content",
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

    it("should return 404 if site does not exist", async () => {
      // Act
      const result = caller.createPage({
        layout: "content",
        permalink: "test-page",
        siteId: 999_999,
        // should not exist
        title: "Test Page",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
      await assertAuditLogRows()
    })

    it("should throw 409 if permalink is not unique", async () => {
      // Arrange
      const { site, page } = await setupPageResource({ resourceType: "Page" })
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = caller.createPage({
        layout: "content",
        permalink: page.permalink,
        siteId: site.id,
        title: "Test Page",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "CONFLICT",
          message: "A resource with the same permalink already exists",
        }),
      )
      await assertAuditLogRows()
    })

    it("should create a new page with Content layout successfully", async () => {
      // Arrange
      const { site } = await setupSite()
      const expectedPageArgs = {
        permalink: "test-page",
        siteId: site.id,
        title: "Test Page",
      }
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = await caller.createPage({
        ...expectedPageArgs,
        layout: "content",
      })

      // Assert
      const actual = await db
        .selectFrom("Resource")
        .innerJoin("Blob", "Resource.draftBlobId", "Blob.id")
        .where("Resource.id", "=", result.pageId)
        .select(["title", "permalink", "type", "siteId", "Blob.content"])
        .executeTakeFirstOrThrow()
      expect(result).toMatchObject({ pageId: expect.any(String) })
      expect(actual).toMatchObject({
        ...expectedPageArgs,
        content: createDefaultPage({ layout: "content" }),
      })
      await assertAuditLogRows(1)
      const auditLog = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLog).toHaveLength(1)
      expect(auditLog[0]).toMatchObject({
        delta: { after: { blob: { content: actual.content } }, before: null },
      })
    })

    it("should create a new page with Article layout successfully", async () => {
      // Arrange
      const { site } = await setupSite()
      const expectedPageArgs = {
        permalink: "test-page",
        siteId: site.id,
        title: "Test Page",
      }
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = await caller.createPage({
        ...expectedPageArgs,
        layout: "article",
      })

      // Assert
      const actual = await db
        .selectFrom("Resource")
        .innerJoin("Blob", "Resource.draftBlobId", "Blob.id")
        .where("Resource.id", "=", result.pageId)
        .select(["title", "permalink", "type", "siteId", "Blob.content"])
        .executeTakeFirstOrThrow()
      expect(result).toMatchObject({ pageId: expect.any(String) })
      expect(actual).toMatchObject({
        ...expectedPageArgs,
        content: createDefaultPage({ layout: "article" }),
      })
      await assertAuditLogRows(1)
      const auditLog = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLog).toHaveLength(1)
      expect(auditLog[0]).toMatchObject({
        delta: { after: { blob: { content: actual.content } }, before: null },
      })
    })

    it("should create a new page with Database layout successfully", async () => {
      // Arrange
      const { site } = await setupSite()
      const expectedPageArgs = {
        permalink: "test-database-page",
        siteId: site.id,
        title: "Test Database Page",
      }
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = await caller.createPage({
        ...expectedPageArgs,
        layout: "database",
      })

      // Assert
      const actual = await db
        .selectFrom("Resource")
        .innerJoin("Blob", "Resource.draftBlobId", "Blob.id")
        .where("Resource.id", "=", result.pageId)
        .select(["title", "permalink", "type", "siteId", "Blob.content"])
        .executeTakeFirstOrThrow()
      expect(result).toMatchObject({ pageId: expect.any(String) })
      expect(actual).toMatchObject({
        ...expectedPageArgs,
        content: createDefaultPage({ layout: "database" }),
      })
      await assertAuditLogRows(1)
      const auditLog = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLog).toHaveLength(1)
      expect(auditLog[0]).toMatchObject({
        delta: { after: { blob: { content: actual.content } }, before: null },
      })
    })

    it("should create a new page with default Content layout if layout is not provided", async () => {
      // Arrange
      const { site } = await setupSite()
      const expectedPageArgs = {
        permalink: "test-page",
        siteId: site.id,
        title: "Test Page",
      }
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = await caller.createPage({ ...expectedPageArgs })

      // Assert
      const actual = await db
        .selectFrom("Resource")
        .innerJoin("Blob", "Resource.draftBlobId", "Blob.id")
        .where("Resource.id", "=", result.pageId)
        .select(["title", "permalink", "type", "siteId", "Blob.content"])
        .executeTakeFirstOrThrow()
      expect(result).toMatchObject({ pageId: expect.any(String) })
      expect(actual).toMatchObject({
        ...expectedPageArgs,
        content: createDefaultPage({ layout: "content" }),
      })
      await assertAuditLogRows(1)
      const auditLog = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLog).toHaveLength(1)
      expect(auditLog[0]).toMatchObject({
        delta: { after: { blob: { content: actual.content } }, before: null },
      })
    })

    it("should create a page in folder successfully", async () => {
      // Arrange
      const { site, folder } = await setupFolder()
      const expectedPageArgs = {
        permalink: "test-page",
        siteId: site.id,
        title: "Test Page",
      }
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = await caller.createPage({
        ...expectedPageArgs,
        folderId: Number(folder.id),
        layout: "content",
      })

      // Assert
      const actual = await db
        .selectFrom("Resource")
        .innerJoin("Blob", "Resource.draftBlobId", "Blob.id")
        .where("Resource.id", "=", result.pageId)
        .select([
          "title",
          "permalink",
          "type",
          "siteId",
          "Blob.content",
          "parentId",
        ])
        .executeTakeFirstOrThrow()
      expect(result).toMatchObject({ pageId: expect.any(String) })
      expect(actual).toMatchObject({
        ...expectedPageArgs,
        content: createDefaultPage({ layout: "content" }),
        parentId: folder.id,
      })
      await assertAuditLogRows(1)
      const auditLog = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLog).toHaveLength(1)
      expect(auditLog[0]).toMatchObject({
        delta: { after: { blob: { content: actual.content } }, before: null },
      })
    })

    it("should throw 404 if folderId does not exist", async () => {
      // Arrange
      const { site } = await setupSite()
      const expectedPageArgs = {
        folderId: 999_999,
        // should not exist
        permalink: "test-page",
        siteId: site.id,
        title: "Test Page",
      }
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = caller.createPage({ ...expectedPageArgs })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message:
            "Parent not found or parentId is not a valid collection or folder",
        }),
      )
      await assertAuditLogRows()
    })

    it("should throw 404 if folderId is not a Folder resource", async () => {
      // Arrange
      const { site, page } = await setupPageResource({ resourceType: "Page" })
      const expectedPageArgs = {
        folderId: Number(page.id),
        permalink: "test-page",
        siteId: site.id,
        title: "Test Page",
      }
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = caller.createPage({ ...expectedPageArgs })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message:
            "Parent not found or parentId is not a valid collection or folder",
        }),
      )
      await assertAuditLogRows()
    })

    // Deferred: Implement tests when permissions are implemented
    it.skip("should throw 403 if user does not have write access to folder", async () => {})
    it.skip("should throw 403 if user does not have write access to root", async () => {})
  })

  describe("getRootPage", () => {
    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      const result = unauthedCaller.getRootPage({ siteId: 1 })

      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return 404 if site does not exist", async () => {
      // Act
      const result = caller.getRootPage({
        siteId: 999_999,
        // should not exist
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

    it("should return the root page successfully", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: "RootPage",
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = await caller.getRootPage({ siteId: site.id })

      // Assert
      expect(result).toMatchObject(pick(page, ["id", "title", "draftBlobId"]))
    })

    it("should return 403 if user does not have read access to root", async () => {
      // Arrange
      const { site } = await setupSite()

      // Act
      const result = caller.getRootPage({ siteId: site.id })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it.skip("should throw 403 if user does not have access to site", async () => {})

    it.skip("should throw 403 if user does not have read access to root", async () => {})
  })

  describe("publishPage", () => {
    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      const result = unauthedCaller.publishPage({ pageId: 1, siteId: 1 })

      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have publish access to the page", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
      })
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = caller.publishPage({
        pageId: Number(page.id),
        siteId: site.id,
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

    it("should return 200 if page is published successfully", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
      })
      await setupPublisherPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })
      const previousVersions = await db
        .selectFrom("Version")
        .where("resourceId", "=", page.id)
        .selectAll()
        .execute()

      expect(previousVersions.length).toEqual(0)

      // Act
      await caller.publishPage({ pageId: Number(page.id), siteId: site.id })

      // Assert - DB (Version)
      const newVersions = await db
        .selectFrom("Version")
        .where("resourceId", "=", page.id)
        .selectAll()
        .execute()

      expect(newVersions.length).toEqual(1)
      expect(newVersions[0]).toMatchObject({
        resourceId: page.id,
        versionNum: 1,
      })

      // Assert - DB (AuditLog)
      const auditLogs = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", AuditLogEvent.Publish)
        .selectAll()
        .execute()
      expect(auditLogs.length).toEqual(1)
    })

    it("should block the first publish when a live redirect occupies the page's URL", async () => {
      // Arrange — a draft page whose URL already has a live redirect
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
      })
      await setupPublisherPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })
      const fullPermalink = await getResourceFullPermalink(
        site.id,
        Number(page.id),
      )
      await db
        .insertInto("Redirect")
        .values({
          destination: "https://www.example.gov.sg",
          siteId: site.id,
          source: normalizeRedirectPath(fullPermalink!),
        })
        .execute()

      // Act
      const result = caller.publishPage({
        pageId: Number(page.id),
        siteId: site.id,
      })

      // Assert — blocked, and nothing published
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "CONFLICT",
          message: `Can't publish — a redirect already exists at ${fullPermalink}. Remove it on the Redirections page first.`,
        }),
      )
      const versions = await db
        .selectFrom("Version")
        .where("resourceId", "=", page.id)
        .selectAll()
        .execute()
      expect(versions.length).toEqual(0)
    })

    it("should allow publishing when a redirect exists at a different path", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
      })
      await setupPublisherPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })
      await db
        .insertInto("Redirect")
        .values({
          destination: "https://www.example.gov.sg",
          siteId: site.id,
          source: "/some-unrelated-path",
        })
        .execute()

      // Act
      await caller.publishPage({ pageId: Number(page.id), siteId: site.id })

      // Assert — published normally
      const versions = await db
        .selectFrom("Version")
        .where("resourceId", "=", page.id)
        .selectAll()
        .execute()
      expect(versions.length).toEqual(1)
    })

    it("should not block re-publishing an already-published page whose URL has a redirect", async () => {
      // Arrange — an already-published page (the source-guard gap aside, this
      // can happen via imported data). Only the first publish is gated.
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
        state: ResourceState.Published,
        userId: session.userId ?? undefined,
      })
      await setupPublisherPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })
      const fullPermalink = await getResourceFullPermalink(
        site.id,
        Number(page.id),
      )
      await db
        .insertInto("Redirect")
        .values({
          destination: "https://www.example.gov.sg",
          siteId: site.id,
          source: normalizeRedirectPath(fullPermalink!),
        })
        .execute()

      // Act / Assert — re-publish is not blocked
      await expect(
        caller.publishPage({ pageId: Number(page.id), siteId: site.id }),
      ).resolves.toBeUndefined()
    })

    it("should back-fill a literal redirect destination into a reference on first publish", async () => {
      // Arrange — a draft page, plus a redirect whose destination is the page's
      // literal path (created before the page was live). Publishing the page
      // should rewrite that literal into a [resource:...] reference so the
      // redirect follows the page's future moves.
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
      })
      await setupPublisherPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })
      const fullPermalink = await getResourceFullPermalink(
        site.id,
        Number(page.id),
      )
      const literalDestination = normalizeRedirectPath(fullPermalink!)
      await db
        .insertInto("Redirect")
        .values({
          destination: literalDestination,
          siteId: site.id,
          source: "/old-url",
        })
        .execute()

      // Act
      await caller.publishPage({ pageId: Number(page.id), siteId: site.id })

      // Assert — the literal destination is now a reference to the page
      const redirect = await db
        .selectFrom("Redirect")
        .selectAll()
        .where("siteId", "=", site.id)
        .where("source", "=", "/old-url")
        .executeTakeFirstOrThrow()
      expect(redirect.destination).toEqual(`[resource:${site.id}:${page.id}]`)

      // Assert — a RedirectDelete entry records the literal form being retired
      const deleteEntry = await db
        .selectFrom("AuditLog")
        .selectAll()
        .where("siteId", "=", site.id)
        .where("eventType", "=", "RedirectDelete")
        .executeTakeFirstOrThrow()
      expect(deleteEntry.userId).toBe(session.userId)
      const deleteDelta = asRedirectDeleteAuditDelta(deleteEntry.delta)
      expect(deleteDelta.before.destination).toBe(literalDestination)
      expect(deleteDelta.before.deletedAt).toBeNull()
      expect(deleteDelta.after.destination).toBe(literalDestination)
      expect(deleteDelta.after.deletedAt).not.toBeNull()

      // Assert — a RedirectCreate entry records the reference form being adopted
      const createEntry = await db
        .selectFrom("AuditLog")
        .selectAll()
        .where("siteId", "=", site.id)
        .where("eventType", "=", "RedirectCreate")
        .executeTakeFirstOrThrow()
      expect(createEntry.userId).toBe(session.userId)
      const createDelta = asRedirectCreateAuditDelta(createEntry.delta)
      expect(createDelta.before).toBeNull()
      expect(createDelta.after.destination).toBe(
        `[resource:${site.id}:${page.id}]`,
      )
    })

    it("should leave a literal redirect to a different path untouched on publish", async () => {
      // Arrange — a redirect pointing at some other path must not be rewritten
      // when an unrelated page is published.
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
      })
      await setupPublisherPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })
      await db
        .insertInto("Redirect")
        .values({
          destination: "/some-other-page",
          siteId: site.id,
          source: "/old-url",
        })
        .execute()

      // Act
      await caller.publishPage({ pageId: Number(page.id), siteId: site.id })

      // Assert — destination is unchanged
      const redirect = await db
        .selectFrom("Redirect")
        .selectAll()
        .where("siteId", "=", site.id)
        .where("source", "=", "/old-url")
        .executeTakeFirstOrThrow()
      expect(redirect.destination).toEqual("/some-other-page")
    })

    it("should back-fill a literal redirect to a folder URL into a container reference when the folder's index page is first published", async () => {
      // Arrange — a folder served by its (draft) IndexPage, plus a redirect
      // whose destination is the folder's literal path. The IndexPage renders at
      // the folder's URL, so publishing it should rewrite the literal into a
      // reference to the CONTAINER (folder), not the index page itself.
      const { site, folder } = await setupFolder({ permalink: "guides" })
      const { page: indexPage } = await setupPageResource({
        parentId: folder.id,
        resourceType: ResourceType.IndexPage,
        siteId: site.id,
      })
      await setupPublisherPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })
      const fullPermalink = await getResourceFullPermalink(
        site.id,
        Number(folder.id),
      )
      await db
        .insertInto("Redirect")
        .values({
          destination: normalizeRedirectPath(fullPermalink!),
          siteId: site.id,
          source: "/old-url",
        })
        .execute()

      // Act — publish the folder's index page (first publish)
      await caller.publishPage({
        pageId: Number(indexPage.id),
        siteId: site.id,
      })

      // Assert — the literal destination now references the folder, so it will
      // follow the folder's future renames
      const redirect = await db
        .selectFrom("Redirect")
        .selectAll()
        .where("siteId", "=", site.id)
        .where("source", "=", "/old-url")
        .executeTakeFirstOrThrow()
      expect(redirect.destination).toEqual(`[resource:${site.id}:${folder.id}]`)
    })
  })

  describe("updateMeta", () => {
    it("should throw 401 if not logged in update", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      const result = unauthedCaller.updateMeta({
        meta: "Test Meta",
        resourceId: "1",
        siteId: 1,
      })

      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have update access to the page", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
      })

      // Act
      const result = caller.updateMeta({
        meta: JSON.stringify({ description: "Test Meta" }),
        resourceId: page.id,
        siteId: site.id,
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

    it("should return 200 if page is updated successfully", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
      })
      await setupPublisherPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = await caller.updateMeta({
        meta: JSON.stringify({ description: "Test Meta" }),
        resourceId: page.id,
        siteId: site.id,
      })

      // Assert
      expect(result).toBeUndefined()
      // not returning anything

      // Assert - DB (AuditLog)
      const auditLogs = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", AuditLogEvent.ResourceUpdate)
        .selectAll()
        .execute()
      expect(auditLogs.length).toEqual(1)
    })
  })

  describe("updateSettings", () => {
    describe("redirect on settings change", () => {
      const liveRedirects = async (siteId: number) =>
        await db
          .selectFrom("Redirect")
          .selectAll()
          .where("siteId", "=", siteId)
          .where("deletedAt", "is", null)
          .execute()

      const setupPublishedPage = async (permalink: string) => {
        const { site, page } = await setupPageResource({
          permalink,
          resourceType: ResourceType.Page,
          state: ResourceState.Published,
          userId: session.userId,
        })
        await setupAdminPermissions({ siteId: site.id, userId: session.userId })
        return { page, site }
      }

      it("creates a redirect from the old URL when the permalink changes", async () => {
        const { site, page } = await setupPublishedPage("old-page")

        await caller.updateSettings({
          pageId: Number(page.id),
          permalink: "new-page",
          shouldCreateRedirect: true,
          siteId: site.id,
          title: "Contact us",
          type: "Page",
        })

        const redirects = await liveRedirects(site.id)
        expect(redirects).toHaveLength(1)
        expect(redirects[0]!.source).toBe("/old-page")
        expect(redirects[0]!.destination).toBe(
          `[resource:${site.id}:${page.id}]`,
        )
      })

      it("does not create a redirect for a title-only change", async () => {
        const { site, page } = await setupPublishedPage("stay")

        await caller.updateSettings({
          pageId: Number(page.id),
          permalink: "stay",
          shouldCreateRedirect: true,
          siteId: site.id,
          title: "Renamed title only",
          type: "Page",
        })

        expect(await liveRedirects(site.id)).toHaveLength(0)
      })

      it("does not create a redirect when shouldCreateRedirect is false", async () => {
        const { site, page } = await setupPublishedPage("old-page")

        await caller.updateSettings({
          pageId: Number(page.id),
          permalink: "new-page",
          shouldCreateRedirect: false,
          siteId: site.id,
          title: "Contact us",
          type: "Page",
        })

        expect(await liveRedirects(site.id)).toHaveLength(0)
      })

      it("blocks renaming a published page onto a path a live redirect points elsewhere from", async () => {
        const { site, page } = await setupPublishedPage("old-page")
        // A live redirect already occupies the new URL, pointing elsewhere —
        // renaming the page onto it would shadow the page.
        await db
          .insertInto("Redirect")
          .values({
            destination: "https://example.gov.sg/elsewhere",
            siteId: site.id,
            source: "/new-page",
          })
          .execute()

        const result = caller.updateSettings({
          pageId: Number(page.id),
          permalink: "new-page",
          shouldCreateRedirect: false,
          siteId: site.id,
          title: "Contact us",
          type: "Page",
        })

        // Assert — blocked, and the whole edit is rolled back (permalink unchanged).
        await expect(result).rejects.toMatchObject({ code: "CONFLICT" })
        const unchanged = await db
          .selectFrom("Resource")
          .select("permalink")
          .where("id", "=", String(page.id))
          .executeTakeFirstOrThrow()
        expect(unchanged.permalink).toBe("old-page")
      })

      it("reclaims a redirect pointing back at the page when the URL is renamed onto it", async () => {
        const { site, page } = await setupPublishedPage("old-page")
        // A redirect at the URL the page is about to occupy, pointing back at it
        // — this is the reclaim case, not a shadow, so the rename is allowed.
        await db
          .insertInto("Redirect")
          .values({
            destination: `[resource:${site.id}:${page.id}]`,
            siteId: site.id,
            source: "/new-page",
          })
          .execute()

        await caller.updateSettings({
          pageId: Number(page.id),
          permalink: "new-page",
          shouldCreateRedirect: true,
          siteId: site.id,
          title: "Contact us",
          type: "Page",
        })

        // The self-pointing redirect at /new-page is reclaimed (soft-deleted)...
        const reclaimed = await db
          .selectFrom("Redirect")
          .selectAll()
          .where("siteId", "=", site.id)
          .where("source", "=", "/new-page")
          .executeTakeFirstOrThrow()
        expect(reclaimed.deletedAt).not.toBeNull()
        // ...and the old URL gets its own redirect.
        const live = await liveRedirects(site.id)
        expect(live).toHaveLength(1)
        expect(live[0]!.source).toBe("/old-page")
      })

      it("revives a soft-deleted redirect at the old URL instead of duplicating it", async () => {
        const { site, page } = await setupPublishedPage("old-page")
        // A previously soft-deleted redirect already occupies the old source
        // (e.g. it was deleted earlier). The upsert should revive this row, not
        // insert a second one at the same (siteId, source).
        const stale = await db
          .insertInto("Redirect")
          .values({
            deletedAt: new Date(),
            destination: "https://example.gov.sg/stale",
            siteId: site.id,
            source: "/old-page",
          })
          .returningAll()
          .executeTakeFirstOrThrow()

        await caller.updateSettings({
          pageId: Number(page.id),
          permalink: "new-page",
          shouldCreateRedirect: true,
          siteId: site.id,
          title: "Contact us",
          type: "Page",
        })

        // Exactly one row at the old source — the stale one, revived in place.
        const rows = await db
          .selectFrom("Redirect")
          .selectAll()
          .where("siteId", "=", site.id)
          .where("source", "=", "/old-page")
          .execute()
        expect(rows).toHaveLength(1)
        expect(rows[0]!.id).toBe(stale.id)
        expect(rows[0]!.deletedAt).toBeNull()
        expect(rows[0]!.destination).toBe(`[resource:${site.id}:${page.id}]`)
      })
    })

    it("should throw 401 if not logged in update", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.updateSettings({
        pageId: 1,
        permalink: "test-page",
        siteId: 1,
        title: "Test Page",
        type: "Page",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return 404 if page does not exist", async () => {
      // Act
      const { site } = await setupSite()
      await setupAdminPermissions({ siteId: site.id, userId: session.userId })
      const result = caller.updateSettings({
        pageId: 1,
        permalink: "test-page",
        siteId: site.id,
        title: "Test Page",
        type: "Page",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message:
            "Unable to load content for the requested page, please contact Isomer Support",
        }),
      )
      await assertAuditLogRows()
    })

    it("should update page settings successfully", async () => {
      // Arrange
      const { site, page } = await setupPageResource({ resourceType: "Page" })
      const expectedSettings = {
        permalink: "new-permalink",
        title: "New Title",
      }
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = await caller.updateSettings({
        pageId: Number(page.id),
        siteId: site.id,
        type: "Page",
        ...expectedSettings,
      })

      // Assert — only a ResourceUpdate entry; an unpublished page has no live
      // presence, so no implicit publish happens.
      await assertAuditLogRows(1)
      const actualResource = await db
        .selectFrom("Resource")
        .where("id", "=", page.id)
        .select([
          "Resource.id",
          "Resource.type",
          "Resource.title",
          "Resource.permalink",
          "Resource.draftBlobId",
        ])
        .executeTakeFirstOrThrow()
      expect(result).toMatchObject(actualResource)
      expect(result).toMatchObject(expectedSettings)
    })

    it("should not log a Publish event when updating settings of an unpublished page", async () => {
      // Arrange
      const { site, page } = await setupPageResource({ resourceType: "Page" })
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      await caller.updateSettings({
        pageId: Number(page.id),
        permalink: "new-permalink",
        siteId: site.id,
        title: "New Title",
        type: "Page",
      })

      // Assert
      const publishLogs = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", AuditLogEvent.Publish)
        .selectAll()
        .execute()
      expect(publishLogs).toHaveLength(0)
    })

    it("should log a Publish event when updating settings of a published page", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: "Page",
        state: ResourceState.Published,
        userId: session.userId,
      })
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      await caller.updateSettings({
        pageId: Number(page.id),
        permalink: "new-permalink",
        siteId: site.id,
        title: "New Title",
        type: "Page",
      })

      // Assert
      const publishLogs = await db
        .selectFrom("AuditLog")
        .where("eventType", "=", AuditLogEvent.Publish)
        .selectAll()
        .execute()
      expect(publishLogs).toHaveLength(1)
    })

    it("should update root page settings successfully", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: "RootPage",
      })
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })
      const expectedSettings = { permalink: "", title: "New Title" }

      // Act
      const result = await caller.updateSettings({
        pageId: Number(page.id),
        siteId: site.id,
        type: "RootPage",
        ...expectedSettings,
      })

      // Assert
      const actualResource = await db
        .selectFrom("Resource")
        .where("id", "=", page.id)
        .select([
          "Resource.id",
          "Resource.type",
          "Resource.title",
          "Resource.permalink",
          "Resource.draftBlobId",
        ])
        .executeTakeFirstOrThrow()
      expect(result).toMatchObject(actualResource)
      expect(result).toMatchObject(expectedSettings)
    })

    it("should not allow changing a page type to RootPage", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: "Page",
      })
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      await caller.updateSettings({
        pageId: Number(page.id),
        siteId: site.id,
        title: "Attempted RootPage",
        type: "RootPage",
      })

      // Assert: type should remain unchanged
      const actualResource = await db
        .selectFrom("Resource")
        .where("id", "=", page.id)
        .select(["Resource.type"])
        .executeTakeFirstOrThrow()
      expect(actualResource.type).toBe("Page")
    })

    it("should throw 409 if permalink is not unique", async () => {
      // Arrange
      const reusedPermalink = "this-is-not-unique"
      const { site } = await setupPageResource({
        permalink: reusedPermalink,
        resourceType: "Page",
      })
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      const { page } = await setupPageResource({
        resourceType: "Page",
        siteId: site.id,
      })

      // Act
      const result = caller.updateSettings({
        pageId: Number(page.id),
        permalink: reusedPermalink,
        siteId: site.id,
        title: "New Title",
        type: "Page",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "CONFLICT",
          message: "A resource with the same permalink already exists",
        }),
      )
    })

    it("should throw 403 if user does not have access to site", async () => {
      // Arrange
      const { site, page } = await setupPageResource({ resourceType: "Page" })
      const expectedSettings = {
        permalink: "new-permalink",
        title: "New Title",
      }

      // Act
      const result = caller.updateSettings({
        pageId: Number(page.id),
        siteId: site.id,
        type: "Page",
        ...expectedSettings,
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

    it.skip("should throw 403 if user does not have write access to page", async () => {})

    it("should throw 400 if attempting to update the search page settings", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        permalink: "search",
        resourceType: "Page",
      })
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = caller.updateSettings({
        pageId: Number(page.id),
        permalink: "search",
        siteId: site.id,
        title: "New Title",
        type: "Page",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "The search page settings cannot be edited",
        }),
      )
    })
  })

  describe("getFullPermalink", () => {
    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      const result = unauthedCaller.getFullPermalink({ pageId: 1, siteId: 1 })

      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return 404 if page does not exist", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({ siteId: site.id, userId: session.userId })

      // Act
      const result = caller.getFullPermalink({
        pageId: 99_999,
        siteId: site.id,
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({
          code: "NOT_FOUND",
          message: "No permalink could be found for the given page",
        }),
      )
    })

    it("should return the full permalink of first-level page successfully", async () => {
      // Arrange
      const { site, page } = await setupPageResource({ resourceType: "Page" })
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = await caller.getFullPermalink({
        pageId: Number(page.id),
        siteId: site.id,
      })

      // Assert
      expect(result).toEqual(`/${page.permalink}`)
    })

    it("should return the full permalink of root page successfully", async () => {
      // Arrange
      const { page, site } = await setupPageResource({
        resourceType: "RootPage",
      })
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = await caller.getFullPermalink({
        pageId: Number(page.id),
        siteId: site.id,
      })

      // Assert
      expect(result).toEqual(`/`)
    })

    it("should return the full permalink of nested page successfully", async () => {
      // Arrange
      const { site, folder } = await setupFolder()
      const { page } = await setupPageResource({
        parentId: folder.id,
        resourceType: "Page",
        siteId: site.id,
      })
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = await caller.getFullPermalink({
        pageId: Number(page.id),
        siteId: site.id,
      })

      // Assert
      expect(result).toEqual(`/${folder.permalink}/${page.permalink}`)
    })

    it("should throw 403 if user does not have access to site", async () => {
      // Arrange
      const { page, site } = await setupPageResource({
        resourceType: "RootPage",
      })
      // Act
      const result = caller.getFullPermalink({
        pageId: Number(page.id),
        siteId: site.id,
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

    it.skip("should throw 403 if user does not have read access to page", async () => {})
  })

  describe("getPermalinkTree", () => {
    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      const result = unauthedCaller.getPermalinkTree({ pageId: 1, siteId: 1 })

      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return 404 if site does not exist", async () => {
      // Act
      const result = caller.getPermalinkTree({
        pageId: 1,
        siteId: 999_999,
        // should not exist
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

    it("should return 404 if page does not exist", async () => {
      // Arrange
      const { site } = await setupSite()

      // Act
      const result = caller.getPermalinkTree({
        pageId: 99_999,
        siteId: site.id,
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

    it("should return the permalink tree of root-level page successfully", async () => {
      // Arrange
      const { site, folder } = await setupFolder()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = await caller.getPermalinkTree({
        pageId: Number(folder.id),
        siteId: site.id,
      })

      // Assert
      expect(result).toEqual([folder.permalink])
    })

    it("should return the permalink tree of second-level page successfully", async () => {
      // Arrange
      const { site, folder } = await setupFolder()
      const { page } = await setupPageResource({
        parentId: folder.id,
        resourceType: "Page",
        siteId: site.id,
      })
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = await caller.getPermalinkTree({
        pageId: Number(page.id),
        siteId: site.id,
      })

      // Assert
      expect(result).toEqual([folder.permalink, page.permalink])
    })

    it("should throw 403 if user does not have access to site", async () => {
      // Arrange
      const { site, folder } = await setupFolder()

      // Act
      const result = caller.getPermalinkTree({
        pageId: Number(folder.id),
        siteId: site.id,
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

    it.skip("should throw 403 if user does not have read access to root", async () => {})
  })

  describe("createIndexPage", () => {
    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      const result = unauthedCaller.createIndexPage({
        parentId: "1",
        siteId: 1,
      })

      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have create access to site", async () => {
      // Arrange
      const { site, folder } = await setupFolder()

      // Act
      const result = caller.createIndexPage({
        parentId: folder.id,
        siteId: site.id,
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

    it("should return 200 if index page is created successfully", async () => {
      // Arrange
      const { site, folder } = await setupFolder()
      await setupAdminPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      const result = await caller.createIndexPage({
        parentId: folder.id,
        siteId: site.id,
      })

      // Assert
      expect(result).toEqual({ pageId: expect.any(String) })
    })
  })
  describe("schedulePage", () => {
    const FIXED_NOW = new Date("2024-01-01T00:00:00.000Z")
    beforeEach(() => {
      MockDate.set(FIXED_NOW)
      // Freeze time before each test
    })
    afterEach(() => {
      MockDate.reset()
      // Reset time after each test
    })
    it("should throw 403 if user does not have publish access to the site", async () => {
      //  Arrange
      const { site, page: expectedPage } = await setupPageResource({
        resourceType: "Page",
      })

      // Act
      const scheduleCaller = caller.schedulePage({
        pageId: Number(expectedPage.id),
        scheduledAt: set(addDays(FIXED_NOW, 1), {
          hours: 10,
          minutes: 0,
          seconds: 0,
          milliseconds: 0,
        }),
        siteId: site.id,
      })

      // Assert
      await expect(scheduleCaller).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })
    it("should set a scheduled time for a page", async () => {
      // Arrange
      const { site, page: expectedPage } = await setupPageResource({
        resourceType: "Page",
      })
      const scheduledAt = set(addDays(FIXED_NOW, 1), {
        hours: 10,
        milliseconds: 0,
        minutes: 0,
        seconds: 0,
      })
      await setupPublisherPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      await caller.schedulePage({
        pageId: Number(expectedPage.id),
        scheduledAt,
        siteId: site.id,
      })

      // Assert
      const actual = await db
        .selectFrom("Resource")
        .where("id", "=", expectedPage.id)
        .selectAll()
        .executeTakeFirstOrThrow()
      // expect the scheduledAt to be tomorrow at 10am
      const expectedDate = set(addDays(FIXED_NOW, 1), {
        hours: 10,
        milliseconds: 0,
        minutes: 0,
        seconds: 0,
      })
      expect(actual.scheduledAt).toEqual(expectedDate)
      expect(actual.scheduledBy).toEqual(session.userId)
      // expect the audit log to be created, with the updated scheduledAt time
      const auditLog = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLog).toHaveLength(1)
      expect(auditLog[0]).toMatchObject({
        delta: {
          before: omit(expectedPage, ["updatedAt", "createdAt"]),
          // NOTE: Need to convert expectedDate to ISO string as the comparison is done with the DB value which is in ISO format
          after: omit(
            {
              ...expectedPage,
              scheduledAt: expectedDate.toISOString(),
              scheduledBy: session.userId,
            },
            ["updatedAt", "createdAt"],
          ),
        },
        eventType: AuditLogEvent.SchedulePublish,
      })
    })
    it("providing a scheduled timestamp in the past leads to an error being thrown", async () => {
      // Arrange
      const { site, page: expectedPage } = await setupPageResource({
        resourceType: "Page",
      })
      await setupPublisherPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      // This should throw an error on the frontend or backend based on the value specified in MINIMUM_SCHEDULE_LEAD_TIME_MINUTES
      await expect(
        caller.schedulePage({
          pageId: Number(expectedPage.id),
          scheduledAt: subDays(FIXED_NOW, 1),
          siteId: site.id,
        }),
      ).rejects.toThrow()

      // Assert
      // Since the request fails, expect scheduledAt to be null
      const pageById = await getPageById(db, {
        resourceId: Number(expectedPage.id),
        siteId: site.id,
      })
      expect(pageById?.scheduledAt).toBeNull()
      // Since the request fails, expect no audit log to be created
      const auditLog = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLog).toHaveLength(0)
    })
    it("should throw 403 if user does not have publish access to the site", async () => {
      //  Arrange
      const { site, page: expectedPage } = await setupPageResource({
        resourceType: "Page",
      })
      // The user is only an editor, not a publisher
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })
      // Act
      const scheduleCaller = caller.schedulePage({
        pageId: Number(expectedPage.id),
        scheduledAt: subDays(FIXED_NOW, 1),
        siteId: site.id,
      })

      // Assert
      await expect(scheduleCaller).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })
    it("should throw 401 if not logged in", async () => {
      //  Arrange
      const { site, page: expectedPage } = await setupPageResource({
        resourceType: "Page",
      })
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.schedulePage({
        pageId: Number(expectedPage.id),
        scheduledAt: subDays(FIXED_NOW, 1),
        siteId: site.id,
      })

      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })
    it("should throw NOT_FOUND if the page resource does not exist", async () => {
      //  Arrange
      const { site, page: expectedPage } = await setupPageResource({
        resourceType: "Page",
      })
      await setupPublisherPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })
      // Act
      const scheduleCaller = caller.schedulePage({
        pageId: Number(expectedPage.id) + 1,
        // Invalid pageId should lead to an error being thrown
        scheduledAt: addDays(FIXED_NOW, 1),
        siteId: site.id,
      })

      // Assert
      await expect(scheduleCaller).rejects.toThrow(
        new TRPCError({ code: "NOT_FOUND", message: "Resource not found" }),
      )
    })
  })
  describe("cancelSchedulePage", () => {
    const FIXED_NOW = new Date("2024-01-01T00:00:00.000Z")
    beforeEach(() => {
      MockDate.set(FIXED_NOW)
      // Freeze time before each test
    })
    afterEach(() => {
      MockDate.reset()
      // Reset time after each test
    })
    // Deferred: check that the request fails if the job is already active - requires mocking the job queue
    it("cancelling a scheduled publish works correctly", async () => {
      // Arrange
      const scheduledAt = set(addDays(FIXED_NOW, 1), {
        hours: 10,
        milliseconds: 0,
        minutes: 0,
        seconds: 0,
      })
      const { site, page: expectedPage } = await setupPageResource({
        resourceType: "Page",
        scheduledAt,
      })
      await setupPublisherPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      await caller.cancelSchedulePage({
        pageId: Number(expectedPage.id),
        siteId: site.id,
      })

      // Assert
      // The scheduledAt field of the page should be null
      const actual = await db
        .selectFrom("Resource")
        .where("id", "=", expectedPage.id)
        .selectAll()
        .executeTakeFirstOrThrow()
      expect(actual.scheduledAt).toBeNull()
      expect(actual.scheduledBy).toBeNull()
    })
    it("cancelling a scheduled publish throws an error if the page is not scheduled", async () => {
      // Arrange
      const { site, page: expectedPage } = await setupPageResource({
        resourceType: "Page",
      })
      await setupPublisherPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act & Assert
      await expect(
        caller.cancelSchedulePage({
          pageId: Number(expectedPage.id),
          siteId: site.id,
        }),
      ).rejects.toThrow(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "Unable to cancel schedule for a page that is not scheduled",
        }),
      )
    })
    it("should throw 403 if user does not have publish access to the site", async () => {
      //  Arrange
      const { site, page: expectedPage } = await setupPageResource({
        resourceType: "Page",
        scheduledAt: set(addDays(FIXED_NOW, 1), {
          hours: 10,
          milliseconds: 0,
          minutes: 0,
          seconds: 0,
        }),
      })
      // The user is only an editor, not a publisher
      await setupEditorPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })
      // Act
      const scheduleCaller = caller.cancelSchedulePage({
        pageId: Number(expectedPage.id),
        siteId: site.id,
      })

      // Assert
      await expect(scheduleCaller).rejects.toThrow(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })
    it("should throw 401 if not logged in", async () => {
      //  Arrange
      const { site, page: expectedPage } = await setupPageResource({
        resourceType: "Page",
        scheduledAt: set(addDays(FIXED_NOW, 1), {
          hours: 10,
          milliseconds: 0,
          minutes: 0,
          seconds: 0,
        }),
      })
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.cancelSchedulePage({
        pageId: Number(expectedPage.id),
        siteId: site.id,
      })

      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })
    it("should throw NOT_FOUND if the page resource does not exist", async () => {
      // Arrange
      const { site, page: expectedPage } = await setupPageResource({
        resourceType: "Page",
        scheduledAt: set(addDays(FIXED_NOW, 1), {
          hours: 10,
          milliseconds: 0,
          minutes: 0,
          seconds: 0,
        }),
      })
      await setupPublisherPermissions({
        siteId: site.id,
        userId: session.userId ?? undefined,
      })

      // Act
      const cancelScheduleCaller = caller.cancelSchedulePage({
        pageId: Number(expectedPage.id) + 1,
        // Invalid pageId should lead to an error being thrown
        siteId: site.id,
      })

      // Assert
      await expect(cancelScheduleCaller).rejects.toThrow(
        new TRPCError({ code: "NOT_FOUND", message: "Resource not found" }),
      )
    })
  })
})
