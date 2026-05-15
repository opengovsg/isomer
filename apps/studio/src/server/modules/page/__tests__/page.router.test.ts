import type { IsomerSchema } from "@opengovsg/isomer-components"
import type { MockInstance } from "vitest"
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
import { vi } from "vitest"
import * as s3Lib from "~/lib/s3"
import { createCallerFactory } from "~/server/trpc"
import {
  AuditLogEvent,
  ResourceState,
  ResourceType,
} from "~prisma/generated/generatedEnums"

import type { User } from "../../database"
import { assertAuditLogRows } from "../../audit/__tests__/utils"
import { db, jsonb } from "../../database"
import { getBlobOfResource, getPageById } from "../../resource/resource.service"
import { pageRouter } from "../page.router"
import { createDefaultPage } from "../page.service"

const createCaller = createCallerFactory(pageRouter)

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
      userId: session.userId ?? undefined,
      email: "test@mock.com",
      isDeleted: false,
    })
    await auth(user)
  })

  describe("getPrefill", () => {
    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      const result = unauthedCaller.getPrefill({ siteId: 1, resourceId: "1" })

      await expect(result).rejects.toThrowError(
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
        siteId: site.id,
        resourceId: page.id,
      })

      // Assert
      await expect(result).rejects.toThrowError(
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
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      // Act
      const result = caller.getPrefill({
        siteId: site.id,
        resourceId: "99999",
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "NOT_FOUND", message: "Resource not found" }),
      )
    })

    it("should return prefill data for article page layout", async () => {
      // Arrange
      const articleBlob = await db
        .insertInto("Blob")
        .values({
          content: jsonb({
            layout: "article",
            page: {
              articlePageHeader: { summary: "Article summary text" },
              image: { src: "/images/article-thumb.jpg", alt: "Article image" },
            },
            content: [],
            version: "0.1.0",
          }),
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      const { site } = await setupSite()
      const page = await db
        .insertInto("Resource")
        .values({
          title: "Test Article Page",
          permalink: "test-article",
          siteId: site.id,
          draftBlobId: articleBlob.id,
          type: ResourceType.Page,
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      await setupEditorPermissions({
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      // Act
      const result = await caller.getPrefill({
        siteId: site.id,
        resourceId: page.id,
      })

      // Assert
      expect(result).toEqual({
        title: "Test Article Page",
        description: "Article summary text",
        thumbnail: "/images/article-thumb.jpg",
        thumbnailAlt: "Article image",
      })
    })

    it("should return prefill data for content page layout", async () => {
      // Arrange
      const contentBlob = await db
        .insertInto("Blob")
        .values({
          content: jsonb({
            layout: "content",
            page: {
              contentPageHeader: { summary: "Content page summary" },
              image: { src: "/images/content-thumb.png", alt: "Content image" },
            },
            content: [],
            version: "0.1.0",
          }),
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      const { site } = await setupSite()
      const page = await db
        .insertInto("Resource")
        .values({
          title: "Test Content Page",
          permalink: "test-content",
          siteId: site.id,
          draftBlobId: contentBlob.id,
          type: ResourceType.Page,
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      await setupEditorPermissions({
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      // Act
      const result = await caller.getPrefill({
        siteId: site.id,
        resourceId: page.id,
      })

      // Assert
      expect(result).toEqual({
        title: "Test Content Page",
        description: "Content page summary",
        thumbnail: "/images/content-thumb.png",
        thumbnailAlt: "Content image",
      })
    })

    it("should return prefill data for index page layout", async () => {
      // Arrange
      const indexBlob = await db
        .insertInto("Blob")
        .values({
          content: jsonb({
            layout: "index",
            page: {
              contentPageHeader: { summary: "Index page summary" },
              image: { src: "/images/index-thumb.png", alt: "Index image" },
            },
            content: [],
            version: "0.1.0",
          }),
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      const { site } = await setupSite()
      const page = await db
        .insertInto("Resource")
        .values({
          title: "Test Index Page",
          permalink: "_index",
          siteId: site.id,
          draftBlobId: indexBlob.id,
          type: ResourceType.IndexPage,
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      await setupEditorPermissions({
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      // Act
      const result = await caller.getPrefill({
        siteId: site.id,
        resourceId: page.id,
      })

      // Assert
      expect(result).toEqual({
        title: "Test Index Page",
        description: "Index page summary",
        thumbnail: "/images/index-thumb.png",
        thumbnailAlt: "Index image",
      })
    })

    it("should return prefill data for database page layout", async () => {
      // Arrange
      const databaseBlob = await db
        .insertInto("Blob")
        .values({
          content: jsonb({
            layout: "database",
            page: {
              contentPageHeader: { summary: "Database page description" },
            },
            content: [],
            version: "0.1.0",
          }),
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      const { site } = await setupSite()
      const page = await db
        .insertInto("Resource")
        .values({
          title: "Test Database Page",
          permalink: "test-database",
          siteId: site.id,
          draftBlobId: databaseBlob.id,
          type: ResourceType.Page,
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      await setupEditorPermissions({
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      // Act
      const result = await caller.getPrefill({
        siteId: site.id,
        resourceId: page.id,
      })

      // Assert
      expect(result).toEqual({
        title: "Test Database Page",
        description: "Database page description",
      })
    })

    it("should return prefill data for collection page layout", async () => {
      // Arrange
      const collectionBlob = await db
        .insertInto("Blob")
        .values({
          content: jsonb({
            layout: "collection",
            page: {
              subtitle: "Collection subtitle text",
            },
            content: [],
            version: "0.1.0",
          }),
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      const { site } = await setupSite()
      const page = await db
        .insertInto("Resource")
        .values({
          title: "Test Collection Page",
          permalink: "test-collection",
          siteId: site.id,
          draftBlobId: collectionBlob.id,
          type: ResourceType.IndexPage,
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      await setupEditorPermissions({
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      // Act
      const result = await caller.getPrefill({
        siteId: site.id,
        resourceId: page.id,
      })

      // Assert
      expect(result).toEqual({
        title: "Test Collection Page",
        description: "Collection subtitle text",
      })
    })

    it("should return prefill data for file ref page layout", async () => {
      // Arrange
      const fileBlob = await db
        .insertInto("Blob")
        .values({
          content: jsonb({
            layout: "file",
            page: {
              description: "File description text",
              image: { src: "/images/file-thumb.png", alt: "File image" },
            },
            content: [],
            version: "0.1.0",
          }),
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      const { site } = await setupSite()
      const page = await db
        .insertInto("Resource")
        .values({
          title: "Test File Page",
          permalink: "test-file",
          siteId: site.id,
          draftBlobId: fileBlob.id,
          type: ResourceType.Page,
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      await setupEditorPermissions({
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      // Act
      const result = await caller.getPrefill({
        siteId: site.id,
        resourceId: page.id,
      })

      // Assert
      expect(result).toEqual({
        title: "Test File Page",
        description: "File description text",
        thumbnail: "/images/file-thumb.png",
        thumbnailAlt: "File image",
      })
    })

    it("should return prefill data for link ref page layout", async () => {
      // Arrange
      const linkBlob = await db
        .insertInto("Blob")
        .values({
          content: jsonb({
            layout: "link",
            page: {
              description: "Link description text",
              image: { src: "/images/link-thumb.png", alt: "Link image" },
            },
            content: [],
            version: "0.1.0",
          }),
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      const { site } = await setupSite()
      const page = await db
        .insertInto("Resource")
        .values({
          title: "Test Link Page",
          permalink: "test-link",
          siteId: site.id,
          draftBlobId: linkBlob.id,
          type: ResourceType.Page,
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      await setupEditorPermissions({
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      // Act
      const result = await caller.getPrefill({
        siteId: site.id,
        resourceId: page.id,
      })

      // Assert
      expect(result).toEqual({
        title: "Test Link Page",
        description: "Link description text",
        thumbnail: "/images/link-thumb.png",
        thumbnailAlt: "Link image",
      })
    })

    it("should return only title for homepage layout", async () => {
      // Arrange
      const homepageBlob = await db
        .insertInto("Blob")
        .values({
          content: jsonb({
            layout: "homepage",
            page: {},
            content: [],
            version: "0.1.0",
          }),
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      const { site } = await setupSite()
      const page = await db
        .insertInto("Resource")
        .values({
          title: "Homepage",
          permalink: "",
          siteId: site.id,
          draftBlobId: homepageBlob.id,
          type: ResourceType.RootPage,
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      await setupEditorPermissions({
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      // Act
      const result = await caller.getPrefill({
        siteId: site.id,
        resourceId: page.id,
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
            layout: "article",
            page: {
              articlePageHeader: { summary: "Article without image" },
            },
            content: [],
            version: "0.1.0",
          }),
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      const { site } = await setupSite()
      const page = await db
        .insertInto("Resource")
        .values({
          title: "Article Without Image",
          permalink: "article-no-image",
          siteId: site.id,
          draftBlobId: articleBlob.id,
          type: ResourceType.Page,
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      await setupEditorPermissions({
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      // Act
      const result = await caller.getPrefill({
        siteId: site.id,
        resourceId: page.id,
      })

      // Assert
      expect(result).toEqual({
        title: "Article Without Image",
        description: "Article without image",
        thumbnail: undefined,
        thumbnailAlt: undefined,
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
            layout: "collection",
            page: {
              subtitle: "Collection index page subtitle",
            },
            content: [],
            version: "0.1.0",
          }),
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      await db
        .insertInto("Resource")
        .values({
          title: "Collection Index",
          permalink: "_index",
          siteId: site.id,
          parentId: collection.id,
          draftBlobId: indexBlob.id,
          type: ResourceType.IndexPage,
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      await setupEditorPermissions({
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      // Act - request prefill for the Collection resource
      const result = await caller.getPrefill({
        siteId: site.id,
        resourceId: collection.id,
      })

      // Assert - should get data from the IndexPage
      expect(result).toEqual({
        title: "Collection Index",
        description: "Collection index page subtitle",
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
            layout: "index",
            page: {
              contentPageHeader: { summary: "Folder index summary" },
              image: { src: "/images/folder-index.png", alt: "Folder" },
            },
            content: [],
            version: "0.1.0",
          }),
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      await db
        .insertInto("Resource")
        .values({
          title: "Folder Index Page",
          permalink: "_index",
          siteId: site.id,
          parentId: folder.id,
          draftBlobId: indexBlob.id,
          type: ResourceType.IndexPage,
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      await setupEditorPermissions({
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      // Act - request prefill for the Folder resource
      const result = await caller.getPrefill({
        siteId: site.id,
        resourceId: folder.id,
      })

      // Assert - should get data from the IndexPage
      expect(result).toEqual({
        title: "Folder Index Page",
        description: "Folder index summary",
        thumbnail: "/images/folder-index.png",
        thumbnailAlt: "Folder",
      })
    })
  })

  describe("list", () => {
    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      const result = unauthedCaller.list({ siteId: 1 })

      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have read access to the site", async () => {
      // Arrange
      const { site } = await setupSite()

      const result = caller.list({ siteId: site.id })

      await expect(result).rejects.toThrowError(
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
        userId: session.userId ?? undefined,
        siteId: site.id,
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

      const result = unauthedCaller.getCategories({ siteId: 1, pageId: 1 })

      await expect(result).rejects.toThrowError(
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
        siteId: site.id,
        pageId: Number(page.id),
      })

      // Assert
      await expect(result).rejects.toThrowError(
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
        siteId: site.id,
        parentId: collection.id,
        resourceType: ResourceType.CollectionPage,
      })
      await setupEditorPermissions({
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      // Act
      const result = await caller.getCategories({
        siteId: site.id,
        pageId: Number(page.id),
      })

      // Assert
      expect(result).toBeDefined()
    })
  })

  describe("readPage", () => {
    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      const result = unauthedCaller.readPage({ siteId: 1, pageId: 1 })

      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return 404 if page does not exist", async () => {
      // Act
      const mockSite = { siteId: 1, pageId: 1 }
      const site = await setupSite(mockSite.siteId)
      await setupAdminPermissions({
        userId: session.userId ?? undefined,
        siteId: site.site.id,
      })
      const result = caller.readPage(mockSite)

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "NOT_FOUND", message: "Resource not found" }),
      )
    })

    it("should return the resource if resource type is Page and exists", async () => {
      // Arrange
      const { site, page: expectedPage } = await setupPageResource({
        resourceType: "Page",
      })
      await setupEditorPermissions({
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      // Act
      const result = await caller.readPage({
        siteId: site.id,
        pageId: Number(expectedPage.id),
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
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      // Act
      const result = await caller.readPage({
        siteId: site.id,
        pageId: Number(expectedPage.id),
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
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      // Act
      const result = await caller.readPage({
        siteId: site.id,
        pageId: Number(expectedPage.id),
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
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      // Act
      const result = caller.readPage({
        siteId: site.id,
        pageId: Number(folder.id),
      })

      // Assert
      await expect(result).rejects.toThrowError(
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
        siteId: site.id,
        pageId: Number(expectedPage.id),
      })

      // Assert
      await expect(result).rejects.toThrowError(
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

      const result = unauthedCaller.readPageAndBlob({ siteId: 1, pageId: 1 })

      await expect(result).rejects.toThrowError(
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
        siteId: site.id,
        pageId: Number(page.id),
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it("should return 404 if page does not exist", async () => {
      const mockSite = { siteId: 1, pageId: 1 }
      const site = await setupSite(mockSite.siteId)
      await setupEditorPermissions({
        userId: session.userId ?? undefined,
        siteId: site.site.id,
      })

      // Act
      const result = caller.readPageAndBlob(mockSite)

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "NOT_FOUND", message: "Resource not found" }),
      )
    })

    it("should return the resource if resource type is Page and exists", async () => {
      // Arrange
      const { site, page, blob, navbar, footer } = await setupPageResource({
        resourceType: "Page",
      })
      await setupEditorPermissions({
        userId: session.userId ?? undefined,
        siteId: site.id,
      })
      const expected = {
        ...pick(page, ["permalink", "title", "type"]),
        navbar: omit(navbar, ["createdAt", "updatedAt"]),
        footer: omit(footer, ["createdAt", "updatedAt"]),
        content: blob.content,
      }

      // Act
      const result = await caller.readPageAndBlob({
        siteId: site.id,
        pageId: Number(page.id),
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
        userId: session.userId ?? undefined,
        siteId: site.id,
      })
      const expected = {
        ...pick(page, ["permalink", "title", "type"]),
        navbar: omit(navbar, ["createdAt", "updatedAt"]),
        footer: omit(footer, ["createdAt", "updatedAt"]),
        content: blob.content,
      }

      // Act
      const result = await caller.readPageAndBlob({
        siteId: site.id,
        pageId: Number(page.id),
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
        userId: session.userId ?? undefined,
        siteId: site.id,
      })
      const expected = {
        ...pick(page, ["permalink", "title", "type"]),
        navbar: omit(navbar, ["createdAt", "updatedAt"]),
        footer: omit(footer, ["createdAt", "updatedAt"]),
        content: blob.content,
      }

      // Act
      const result = await caller.readPageAndBlob({
        siteId: site.id,
        pageId: Number(page.id),
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
        userId: session.userId ?? undefined,
        siteId: site.id,
      })
      const expected = {
        ...pick(page, ["permalink", "title", "type"]),
        navbar: omit(navbar, ["createdAt", "updatedAt"]),
        footer: omit(footer, ["createdAt", "updatedAt"]),
        content: blob.content,
      }

      // Act
      const result = await caller.readPageAndBlob({
        siteId: site.id,
        pageId: Number(page.id),
      })

      // Assert
      expect(result.type).toEqual("FolderMeta")
      expect(result).toMatchObject(expected)
    })

    it("should return 404 if resource type is not a page", async () => {
      // Arrange
      const { site, folder } = await setupFolder()
      await setupEditorPermissions({
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      // Act
      const result = caller.readPageAndBlob({
        siteId: site.id,
        pageId: Number(folder.id),
      })

      // Assert
      await expect(result).rejects.toThrowError(
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
        siteId: 1,
        pageId: 1,
        from: 0,
        to: 1,
        blocks: pageToReorder.blob.content.content,
      })

      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
      await assertAuditLogRows()
    })

    it("should throw 403 if user does not have update access to the page", async () => {
      // Act
      const result = caller.reorderBlock({
        siteId: pageToReorder.site.id,
        pageId: Number(pageToReorder.page.id),
        from: 0,
        to: 1,
        blocks: pageToReorder.blob.content.content,
      })

      // Assert
      await expect(result).rejects.toThrowError(
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
        userId: session.userId ?? undefined,
        siteId: pageToReorder.site.id,
      })

      // Act
      const result = caller.reorderBlock({
        siteId: pageToReorder.site.id,
        pageId: 999999, // should not exist
        from: 0,
        to: 1,
        blocks: pageToReorder.blob.content.content,
      })

      // Assert
      await expect(result).rejects.toThrowError(
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
          type: "prose",
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
        },
      ]
      expect(unexpectedBlock).not.toEqual(pageToReorder.blob.content.content)
      await setupAdminPermissions({
        userId: session.userId ?? undefined,
        siteId: pageToReorder.site.id,
      })

      // Act
      const result = caller.reorderBlock({
        siteId: pageToReorder.site.id,
        pageId: Number(pageToReorder.page.id),
        from: 0,
        to: 1,
        blocks: unexpectedBlock,
      })

      // Assert
      await expect(result).rejects.toThrowError(
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
        userId: session.userId ?? undefined,
        siteId: pageToReorder.site.id,
      })

      // Act
      const result = caller.reorderBlock({
        siteId: pageToReorder.site.id,
        pageId: Number(pageToReorder.page.id),
        from: fromArg, // should not exist
        to: 1,
        blocks: pageToReorder.blob.content.content,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNPROCESSABLE_CONTENT" }),
      )
      await assertAuditLogRows()
    })

    it("should fail validation if `from` arg is negative index", async () => {
      //Arrange
      await setupAdminPermissions({
        userId: session.userId ?? undefined,
        siteId: pageToReorder.site.id,
      })

      // Act & Assert
      await expect(
        caller.reorderBlock({
          siteId: pageToReorder.site.id,
          pageId: Number(pageToReorder.page.id),
          from: -1,
          to: 1,
          blocks: pageToReorder.blob.content.content,
        }),
      ).rejects.toThrowError("Number must be greater than or equal to 0")
      await assertAuditLogRows()
    })

    it("should return 422 if `to` arg is out of bounds", async () => {
      // Arrange
      const toArg = pageToReorder.blob.content.content.length + 10
      await setupAdminPermissions({
        userId: session.userId ?? undefined,
        siteId: pageToReorder.site.id,
      })

      // Act
      const result = caller.reorderBlock({
        siteId: pageToReorder.site.id,
        pageId: Number(pageToReorder.page.id),
        from: 1,
        to: toArg, // should not exist
        blocks: pageToReorder.blob.content.content,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNPROCESSABLE_CONTENT" }),
      )
      await assertAuditLogRows()
    })

    it("should fail validation if `to` arg is negative index", async () => {
      // Arrange
      await setupAdminPermissions({
        userId: session.userId ?? undefined,
        siteId: pageToReorder.site.id,
      })

      // Act & Assert
      await expect(
        caller.reorderBlock({
          siteId: pageToReorder.site.id,
          pageId: Number(pageToReorder.page.id),
          from: 1,
          to: -1,
          blocks: pageToReorder.blob.content.content,
        }),
      ).rejects.toThrowError("Number must be greater than or equal to 0")
      await assertAuditLogRows()
    })

    it("should reorder block if args are valid", async () => {
      // Arrange
      await setupAdminPermissions({
        userId: session.userId ?? undefined,
        siteId: pageToReorder.site.id,
      })
      const oldBlob = db
        .selectFrom("Blob")
        .where("id", "=", pageToReorder.blob.id)
        .executeTakeFirstOrThrow()

      // Act
      const result = await caller.reorderBlock({
        siteId: pageToReorder.site.id,
        pageId: Number(pageToReorder.page.id),
        from: 0,
        to: 1,
        blocks: pageToReorder.blob.content.content,
      })

      // Assert
      const actual = await db
        .selectFrom("Blob")
        .where("id", "=", pageToReorder.blob.id)
        .select("content")
        .executeTakeFirstOrThrow()
      const expectedBlocks = pageToReorder.blob.content.content.reverse()
      expect(actual.content.content).toEqual(expectedBlocks)
      expect(result).toEqual(expectedBlocks)
      await assertAuditLogRows(1)
      const auditLog = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLog[0]).toMatchObject({
        eventType: "ResourceUpdate",
        delta: {
          before: {
            blob: oldBlob,
            resource: omit(pageToReorder.page, ["updatedAt", "createdAt"]),
          },
          after: {
            blob: actual,
            resource: omit(pageToReorder.page, ["updatedAt", "createdAt"]),
          },
        },
      })
    })
  })

  describe("updatePageBlob", () => {
    const NEW_PAGE_BLOCKS: IsomerSchema["content"] = [
      {
        type: "prose",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "This is the new block" }],
          },
        ],
      },
      {
        type: "callout",
        content: {
          type: "prose",
          content: [
            {
              type: "paragraph",
              content: [{ type: "text", text: "Test Callout content" }],
            },
          ],
        },
      },
    ]

    type Page = Awaited<ReturnType<typeof setupPageResource>>["page"]
    let pageToUpdate: Page
    type UpdatePageOutput = z.output<typeof updatePageBlobSchema>
    const createPageUpdateArgs = (page: Page) => {
      return {
        pageId: Number(page.id),
        siteId: page.siteId,
        content: JSON.stringify({
          content: NEW_PAGE_BLOCKS,
          layout: "content",
          page: pick(page, ["title", "permalink"]),
          version: "0.1.0",
        } as UpdatePageOutput["content"]),
      }
    }

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
      await expect(result).rejects.toThrowError(
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
      await expect(result).rejects.toThrowError(
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
        userId: session.userId ?? undefined,
        siteId: pageToUpdate.siteId,
      })

      // Act
      const result = caller.updatePageBlob({
        ...pageUpdateArgs,
        pageId: 999999, // should not exist
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "NOT_FOUND", message: "Resource not found" }),
      )
      await assertAuditLogRows()
    })

    it("should return 422 if content is not valid", async () => {
      // Arrange
      const pageUpdateArgs = createPageUpdateArgs(pageToUpdate)
      await setupAdminPermissions({
        userId: session.userId ?? undefined,
        siteId: pageToUpdate.siteId,
      })

      // Act
      const result = caller.updatePageBlob({
        ...pageUpdateArgs,
        content: "do not match the shape",
      })

      // Assert
      await expect(result).rejects.toThrowError("Schema validation failed")
      await assertAuditLogRows()
    })

    it("should update draft page blob if args are valid and has current draft", async () => {
      // Arrange
      const pageUpdateArgs = createPageUpdateArgs(pageToUpdate)
      await setupAdminPermissions({
        userId: session.userId ?? undefined,
        siteId: pageToUpdate.siteId,
      })
      const oldBlob = await db
        .transaction()
        .execute((tx) =>
          getBlobOfResource({ db: tx, resourceId: pageToUpdate.id }),
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
        eventType: "ResourceUpdate",
        delta: {
          before: {
            blob: omit(oldBlob, ["updatedAt", "createdAt"]),
            resource: omit(pageToUpdate, ["updatedAt", "createdAt"]),
          },
          after: {
            blob: omit(actual, ["publishedVersionId", "draftBlobId"]),
            resource: omit(pageToUpdate, ["updatedAt", "createdAt"]),
          },
        },
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
        userId: session.userId ?? undefined,
        siteId: publishedPageToUpdate.siteId,
      })
      expect(publishedPageToUpdate.publishedVersionId).not.toBeNull()
      expect(publishedPageToUpdate.draftBlobId).toBeNull()
      const pageUpdateArgs = createPageUpdateArgs(publishedPageToUpdate)
      const oldBlob = await db
        .transaction()
        .execute((tx) =>
          getBlobOfResource({ db: tx, resourceId: publishedPageToUpdate.id }),
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
        publishedVersionId: publishedPageToUpdate.publishedVersionId,
        draftBlobId: expect.any(String),
      })
      await assertAuditLogRows(1)
      const auditLog = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLog[0]).toMatchObject({
        eventType: "ResourceUpdate",
        delta: {
          before: {
            blob: omit(oldBlob, ["updatedAt", "createdAt"]),
            resource: omit(publishedPageToUpdate, ["updatedAt", "createdAt"]),
          },
          after: {
            blob: omit(actual, ["publishedVersionId", "draftBlobId"]),
            resource: omit(publishedPageToUpdate, ["updatedAt", "createdAt"]),
          },
        },
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
        siteId: 1,
        title: "Test Page",
        permalink: "test-page",
        layout: "content",
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
      await assertAuditLogRows()
    })

    it("should throw 403 if user does not have create access to the site", async () => {
      // Arrange
      const { site } = await setupSite()
      const expectedPageArgs = {
        siteId: site.id,
        title: "Test Page",
        permalink: "test-page",
      }

      // Act
      const result = caller.createPage({
        ...expectedPageArgs,
        layout: "content",
      })

      // Assert
      await expect(result).rejects.toThrowError(
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
        siteId: 999999, // should not exist
        title: "Test Page",
        permalink: "test-page",
        layout: "content",
      })

      // Assert
      await expect(result).rejects.toThrowError(
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
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      // Act
      const result = caller.createPage({
        siteId: site.id,
        title: "Test Page",
        permalink: page.permalink,
        layout: "content",
      })

      // Assert
      await assertAuditLogRows()
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "CONFLICT",
          message: "A resource with the same permalink already exists",
        }),
      )
    })

    it("should create a new page with Content layout successfully", async () => {
      // Arrange
      const { site } = await setupSite()
      const expectedPageArgs = {
        siteId: site.id,
        title: "Test Page",
        permalink: "test-page",
      }
      await setupAdminPermissions({
        userId: session.userId ?? undefined,
        siteId: site.id,
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
        delta: { before: null, after: { blob: { content: actual.content } } },
      })
    })

    it("should create a new page with Article layout successfully", async () => {
      // Arrange
      const { site } = await setupSite()
      const expectedPageArgs = {
        siteId: site.id,
        title: "Test Page",
        permalink: "test-page",
      }
      await setupAdminPermissions({
        userId: session.userId ?? undefined,
        siteId: site.id,
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
        delta: { before: null, after: { blob: { content: actual.content } } },
      })
    })

    it("should create a new page with Database layout successfully", async () => {
      // Arrange
      const { site } = await setupSite()
      const expectedPageArgs = {
        siteId: site.id,
        title: "Test Database Page",
        permalink: "test-database-page",
      }
      await setupAdminPermissions({
        userId: session.userId ?? undefined,
        siteId: site.id,
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
        delta: { before: null, after: { blob: { content: actual.content } } },
      })
    })

    it("should create a new page with default Content layout if layout is not provided", async () => {
      // Arrange
      const { site } = await setupSite()
      const expectedPageArgs = {
        siteId: site.id,
        title: "Test Page",
        permalink: "test-page",
      }
      await setupAdminPermissions({
        userId: session.userId ?? undefined,
        siteId: site.id,
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
        delta: { before: null, after: { blob: { content: actual.content } } },
      })
    })

    it("should create a page in folder successfully", async () => {
      // Arrange
      const { site, folder } = await setupFolder()
      const expectedPageArgs = {
        siteId: site.id,
        title: "Test Page",
        permalink: "test-page",
      }
      await setupAdminPermissions({
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      // Act
      const result = await caller.createPage({
        ...expectedPageArgs,
        layout: "content",
        folderId: Number(folder.id),
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
        parentId: folder.id,
        content: createDefaultPage({ layout: "content" }),
      })
      await assertAuditLogRows(1)
      const auditLog = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLog).toHaveLength(1)
      expect(auditLog[0]).toMatchObject({
        delta: { before: null, after: { blob: { content: actual.content } } },
      })
    })

    it("should throw 400 if folderId does not exist", async () => {
      // Arrange
      const { site } = await setupSite()
      const expectedPageArgs = {
        siteId: site.id,
        title: "Test Page",
        permalink: "test-page",
        folderId: 999999, // should not exist
      }
      await setupAdminPermissions({
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      // Act
      const result = caller.createPage({ ...expectedPageArgs })

      // Assert
      await assertAuditLogRows()
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Parent not found or parentId is not a valid collection or folder",
        }),
      )
    })

    it("should throw 400 if folderId is not a Folder resource", async () => {
      // Arrange
      const { site, page } = await setupPageResource({ resourceType: "Page" })
      const expectedPageArgs = {
        siteId: site.id,
        title: "Test Page",
        permalink: "test-page",
        folderId: Number(page.id),
      }
      await setupAdminPermissions({
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      // Act
      const result = caller.createPage({ ...expectedPageArgs })

      // Assert
      await assertAuditLogRows()
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Parent not found or parentId is not a valid collection or folder",
        }),
      )
    })

    // TODO: Implement tests when permissions are implemented
    it.skip("should throw 403 if user does not have write access to folder", async () => {})
    it.skip("should throw 403 if user does not have write access to root", async () => {})
  })

  describe("duplicatePage", () => {
    let copySpy: MockInstance<typeof s3Lib.copyObjectInBucket>

    beforeEach(() => {
      copySpy = vi
        .spyOn(s3Lib, "copyObjectInBucket")
        .mockResolvedValue(undefined)
    })

    afterEach(() => {
      copySpy.mockRestore()
    })

    it("should throw 401 if not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.duplicatePage({
        siteId: 1,
        pageId: 1,
        title: "Copy of Page",
        permalink: "page-copy",
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return 404 for non-Page resources", async () => {
      // Arrange
      const { collection, site } = await setupCollection()
      const { page } = await setupPageResource({
        siteId: site.id,
        parentId: collection.id,
        resourceType: ResourceType.CollectionPage,
      })
      await setupAdminPermissions({
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      // Act
      const result = caller.duplicatePage({
        siteId: site.id,
        pageId: Number(page.id),
        title: "Copy",
        permalink: "copy",
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "NOT_FOUND", message: "Page not found" }),
      )
    })

    it("should duplicate a page as draft with a new permalink", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
        permalink: "about-us",
        title: "About us",
      })
      await setupAdminPermissions({
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      // Act
      const result = await caller.duplicatePage({
        siteId: site.id,
        pageId: Number(page.id),
        title: "Copy of About us",
        permalink: "about-us-copy",
      })

      // Assert
      expect(copySpy).not.toHaveBeenCalled()

      const duplicate = await db
        .selectFrom("Resource")
        .where("id", "=", result.pageId)
        .selectAll()
        .executeTakeFirstOrThrow()

      expect(duplicate).toMatchObject({
        title: "Copy of About us",
        permalink: "about-us-copy",
        type: ResourceType.Page,
        state: ResourceState.Draft,
        publishedVersionId: null,
        parentId: page.parentId,
      })
      await assertAuditLogRows(1)
    })

    it("should copy assets and rewrite blob references", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      const assetKey = `${site.id}/550e8400-e29b-41d4-a716-446655440000/photo.png`
      const blob = await db
        .insertInto("Blob")
        .values({
          content: jsonb({
            page: { contentPageHeader: { summary: "Summary" } },
            layout: "content",
            content: [
              {
                type: "image",
                src: `/${assetKey}`,
                alt: "Alt",
                size: "default",
              },
            ],
            version: "0.1.0",
          }),
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      const page = await db
        .insertInto("Resource")
        .values({
          title: "With asset",
          permalink: "with-asset",
          siteId: site.id,
          draftBlobId: blob.id,
          type: ResourceType.Page,
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      // Act
      await caller.duplicatePage({
        siteId: site.id,
        pageId: Number(page.id),
        title: "Copy of With asset",
        permalink: "with-asset-copy",
      })

      // Assert
      expect(copySpy).toHaveBeenCalledTimes(1)
      const destKey = copySpy.mock.calls[0]?.[0].destinationKey!
      expect(destKey).toMatch(
        new RegExp(`^${site.id}/[0-9a-f-]{36}/photo\\.png$`),
      )
      expect(copySpy.mock.calls[0]?.[0].sourceKey).toBe(assetKey)

      const dupRow = await db
        .selectFrom("Resource")
        .innerJoin("Blob", "Resource.draftBlobId", "Blob.id")
        .where("Resource.permalink", "=", "with-asset-copy")
        .select(["Blob.content"])
        .executeTakeFirstOrThrow()

      const src = (dupRow.content as { content: { src: string }[] }).content[0]
        ?.src
      expect(src).toBe(`/${destKey}`)
      expect(src).not.toBe(`/${assetKey}`)
    })

    it("should return CONFLICT when the chosen permalink already exists", async () => {
      const { site, page: first } = await setupPageResource({
        resourceType: ResourceType.Page,
        permalink: "page-a",
        title: "First",
      })
      await setupPageResource({
        siteId: site.id,
        resourceType: ResourceType.Page,
        permalink: "page-b",
        title: "Second",
        parentId: first.parentId,
      })
      await setupAdminPermissions({
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      const result = caller.duplicatePage({
        siteId: site.id,
        pageId: Number(first.id),
        title: "Copy of First",
        permalink: "page-b",
      })

      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "CONFLICT",
          message: "A resource with the same permalink already exists",
        }),
      )
    })
  })

  describe("getRootPage", () => {
    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      const result = unauthedCaller.getRootPage({ siteId: 1 })

      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return 404 if site does not exist", async () => {
      // Act
      const result = caller.getRootPage({
        siteId: 999999, // should not exist
      })

      // Assert
      await expect(result).rejects.toThrowError(
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
        userId: session.userId ?? undefined,
        siteId: site.id,
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
      await expect(result).rejects.toThrowError(
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

      const result = unauthedCaller.publishPage({ siteId: 1, pageId: 1 })

      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have publish access to the page", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: ResourceType.Page,
      })
      await setupEditorPermissions({
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      // Act
      const result = caller.publishPage({
        siteId: site.id,
        pageId: Number(page.id),
      })

      // Assert
      await expect(result).rejects.toThrowError(
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
        userId: session.userId ?? undefined,
        siteId: site.id,
      })
      const previousVersions = await db
        .selectFrom("Version")
        .where("resourceId", "=", page.id)
        .selectAll()
        .execute()

      expect(previousVersions.length).toEqual(0)

      // Act
      await caller.publishPage({ siteId: site.id, pageId: Number(page.id) })

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
  })

  describe("updateMeta", () => {
    it("should throw 401 if not logged in update", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      const result = unauthedCaller.updateMeta({
        siteId: 1,
        resourceId: "1",
        meta: "Test Meta",
      })

      await expect(result).rejects.toThrowError(
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
        siteId: site.id,
        resourceId: page.id,
        meta: JSON.stringify({ description: "Test Meta" }),
      })

      // Assert
      await expect(result).rejects.toThrowError(
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
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      // Act
      const result = await caller.updateMeta({
        siteId: site.id,
        resourceId: page.id,
        meta: JSON.stringify({ description: "Test Meta" }),
      })

      // Assert
      expect(result).toBeUndefined() // not returning anything

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
    it("should throw 401 if not logged in update", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.updateSettings({
        siteId: 1,
        pageId: 1,
        title: "Test Page",
        permalink: "test-page",
        type: "Page",
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return 404 if page does not exist", async () => {
      // Act
      const { site } = await setupSite()
      await setupAdminPermissions({ userId: session.userId, siteId: site.id })
      const result = caller.updateSettings({
        siteId: site.id,
        pageId: 1,
        title: "Test Page",
        permalink: "test-page",
        type: "Page",
      })

      // Assert
      await assertAuditLogRows()
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "NOT_FOUND",
          message:
            "Unable to load content for the requested page, please contact Isomer Support",
        }),
      )
    })

    it("should update page settings successfully", async () => {
      // Arrange
      const { site, page } = await setupPageResource({ resourceType: "Page" })
      const expectedSettings = {
        title: "New Title",
        permalink: "new-permalink",
      }
      await setupAdminPermissions({
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      // Act
      const result = await caller.updateSettings({
        siteId: site.id,
        pageId: Number(page.id),
        type: "Page",
        ...expectedSettings,
      })

      // Assert
      await assertAuditLogRows(2)
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
      await assertAuditLogRows(2)
    })

    it("should update root page settings successfully", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: "RootPage",
      })
      await setupAdminPermissions({
        userId: session.userId ?? undefined,
        siteId: site.id,
      })
      const expectedSettings = { title: "New Title", permalink: "" }

      // Act
      const result = await caller.updateSettings({
        siteId: site.id,
        pageId: Number(page.id),
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

    it("should throw 409 if permalink is not unique", async () => {
      // Arrange
      const reusedPermalink = "this-is-not-unique"
      const { site } = await setupPageResource({
        permalink: reusedPermalink,
        resourceType: "Page",
      })
      await setupAdminPermissions({
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      const { page } = await setupPageResource({
        resourceType: "Page",
        siteId: site.id,
      })

      // Act
      const result = caller.updateSettings({
        siteId: site.id,
        pageId: Number(page.id),
        title: "New Title",
        permalink: reusedPermalink,
        type: "Page",
      })

      // Assert
      await expect(result).rejects.toThrowError(
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
        title: "New Title",
        permalink: "new-permalink",
      }

      // Act
      const result = caller.updateSettings({
        siteId: site.id,
        pageId: Number(page.id),
        type: "Page",
        ...expectedSettings,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it.skip("should throw 403 if user does not have write access to page", async () => {})
  })

  describe("getFullPermalink", () => {
    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      const result = unauthedCaller.getFullPermalink({ siteId: 1, pageId: 1 })

      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return 404 if page does not exist", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({ userId: session.userId, siteId: site.id })

      // Act
      const result = caller.getFullPermalink({ siteId: site.id, pageId: 99999 })

      // Assert
      await expect(result).rejects.toThrowError(
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
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      // Act
      const result = await caller.getFullPermalink({
        siteId: site.id,
        pageId: Number(page.id),
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
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      // Act
      const result = await caller.getFullPermalink({
        siteId: site.id,
        pageId: Number(page.id),
      })

      // Assert
      expect(result).toEqual(`/`)
    })

    it("should return the full permalink of nested page successfully", async () => {
      // Arrange
      const { site, folder } = await setupFolder()
      const { page } = await setupPageResource({
        resourceType: "Page",
        parentId: folder.id,
        siteId: site.id,
      })
      await setupAdminPermissions({
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      // Act
      const result = await caller.getFullPermalink({
        siteId: site.id,
        pageId: Number(page.id),
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
        siteId: site.id,
        pageId: Number(page.id),
      })

      // Assert
      await expect(result).rejects.toThrowError(
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

      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return 404 if site does not exist", async () => {
      // Act
      const result = caller.getPermalinkTree({
        pageId: 1,
        siteId: 999999, // should not exist
      })

      // Assert
      await expect(result).rejects.toThrowError(
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
      const result = caller.getPermalinkTree({ siteId: site.id, pageId: 99999 })

      // Assert
      await expect(result).rejects.toThrowError(
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
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      // Act
      const result = await caller.getPermalinkTree({
        siteId: site.id,
        pageId: Number(folder.id),
      })

      // Assert
      expect(result).toEqual([folder.permalink])
    })

    it("should return the permalink tree of second-level page successfully", async () => {
      // Arrange
      const { site, folder } = await setupFolder()
      const { page } = await setupPageResource({
        resourceType: "Page",
        parentId: folder.id,
        siteId: site.id,
      })
      await setupAdminPermissions({
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      // Act
      const result = await caller.getPermalinkTree({
        siteId: site.id,
        pageId: Number(page.id),
      })

      // Assert
      expect(result).toEqual([folder.permalink, page.permalink])
    })

    it("should throw 403 if user does not have access to site", async () => {
      // Arrange
      const { site, folder } = await setupFolder()

      // Act
      const result = caller.getPermalinkTree({
        siteId: site.id,
        pageId: Number(folder.id),
      })

      // Assert
      await expect(result).rejects.toThrowError(
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
        siteId: 1,
        parentId: "1",
      })

      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have create access to site", async () => {
      // Arrange
      const { site, folder } = await setupFolder()

      // Act
      const result = caller.createIndexPage({
        siteId: site.id,
        parentId: folder.id,
      })

      // Assert
      await expect(result).rejects.toThrowError(
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
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      // Act
      const result = await caller.createIndexPage({
        siteId: site.id,
        parentId: folder.id,
      })

      // Assert
      expect(result).toEqual({ pageId: expect.any(String) })
    })
  })
  describe("schedulePage", () => {
    const FIXED_NOW = new Date("2024-01-01T00:00:00.000Z")
    beforeEach(() => {
      MockDate.set(FIXED_NOW) // Freeze time before each test
    })
    afterEach(() => {
      MockDate.reset() // Reset time after each test
    })
    it("should throw 403 if user does not have publish access to the site", async () => {
      //  Arrange
      const { site, page: expectedPage } = await setupPageResource({
        resourceType: "Page",
      })

      // Act
      const scheduleCaller = caller.schedulePage({
        siteId: site.id,
        pageId: Number(expectedPage.id),
        scheduledAt: set(addDays(FIXED_NOW, 1), {
          hours: 10,
          minutes: 0,
          seconds: 0,
          milliseconds: 0,
        }),
      })

      // Assert
      await expect(scheduleCaller).rejects.toThrowError(
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
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      })
      await setupPublisherPermissions({
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      // Act
      await caller.schedulePage({
        siteId: site.id,
        pageId: Number(expectedPage.id),
        scheduledAt,
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
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      })
      expect(actual.scheduledAt).toEqual(expectedDate)
      expect(actual.scheduledBy).toEqual(session.userId)
      // expect the audit log to be created, with the updated scheduledAt time
      const auditLog = await db.selectFrom("AuditLog").selectAll().execute()
      expect(auditLog).toHaveLength(1)
      expect(auditLog[0]).toMatchObject({
        eventType: AuditLogEvent.SchedulePublish,
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
      })
    })
    it("providing a scheduled timestamp in the past leads to an error being thrown", async () => {
      // Arrange
      const { site, page: expectedPage } = await setupPageResource({
        resourceType: "Page",
      })
      await setupPublisherPermissions({
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      // Act
      // This should throw an error on the frontend or backend based on the value specified in MINIMUM_SCHEDULE_LEAD_TIME_MINUTES
      await expect(
        caller.schedulePage({
          siteId: site.id,
          pageId: Number(expectedPage.id),
          scheduledAt: subDays(FIXED_NOW, 1),
        }),
      ).rejects.toThrowError()

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
        userId: session.userId ?? undefined,
        siteId: site.id,
      })
      // Act
      const scheduleCaller = caller.schedulePage({
        siteId: site.id,
        pageId: Number(expectedPage.id),
        scheduledAt: subDays(FIXED_NOW, 1),
      })

      // Assert
      await expect(scheduleCaller).rejects.toThrowError(
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
        siteId: site.id,
        pageId: Number(expectedPage.id),
        scheduledAt: subDays(FIXED_NOW, 1),
      })

      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })
    it("should throw an error if the resource is not found", async () => {
      //  Arrange
      const { site, page: expectedPage } = await setupPageResource({
        resourceType: "Page",
      })
      // The user is only an editor, not a publisher
      await setupPublisherPermissions({
        userId: session.userId ?? undefined,
        siteId: site.id,
      })
      // Act
      const scheduleCaller = caller.schedulePage({
        siteId: site.id,
        pageId: Number(expectedPage.id) + 1, // Invalid pageId should lead to an error being thrown
        scheduledAt: addDays(FIXED_NOW, 1),
      })

      // Assert
      await expect(scheduleCaller).rejects.toThrowError(
        new TRPCError({ code: "BAD_REQUEST", message: "Resource not found" }),
      )
    })
  })
  describe("cancelSchedulePage", () => {
    const FIXED_NOW = new Date("2024-01-01T00:00:00.000Z")
    beforeEach(() => {
      MockDate.set(FIXED_NOW) // Freeze time before each test
    })
    afterEach(() => {
      MockDate.reset() // Reset time after each test
    })
    // TODO: check that the request fails if the job is already active - requires mocking the job queue
    it("cancelling a scheduled publish works correctly", async () => {
      // Arrange
      const scheduledAt = set(addDays(FIXED_NOW, 1), {
        hours: 10,
        minutes: 0,
        seconds: 0,
        milliseconds: 0,
      })
      const { site, page: expectedPage } = await setupPageResource({
        resourceType: "Page",
        scheduledAt,
      })
      await setupPublisherPermissions({
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      // Act
      await caller.cancelSchedulePage({
        siteId: site.id,
        pageId: Number(expectedPage.id),
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
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      // Act & Assert
      await expect(
        caller.cancelSchedulePage({
          siteId: site.id,
          pageId: Number(expectedPage.id),
        }),
      ).rejects.toThrowError(
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
          minutes: 0,
          seconds: 0,
          milliseconds: 0,
        }),
      })
      // The user is only an editor, not a publisher
      await setupEditorPermissions({
        userId: session.userId ?? undefined,
        siteId: site.id,
      })
      // Act
      const scheduleCaller = caller.cancelSchedulePage({
        siteId: site.id,
        pageId: Number(expectedPage.id),
      })

      // Assert
      await expect(scheduleCaller).rejects.toThrowError(
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
          minutes: 0,
          seconds: 0,
          milliseconds: 0,
        }),
      })
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      // Act
      const result = unauthedCaller.cancelSchedulePage({
        siteId: site.id,
        pageId: Number(expectedPage.id),
      })

      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })
    it("should throw an error if the resource is not found", async () => {
      // Arrange
      const { site, page: expectedPage } = await setupPageResource({
        resourceType: "Page",
        scheduledAt: set(addDays(FIXED_NOW, 1), {
          hours: 10,
          minutes: 0,
          seconds: 0,
          milliseconds: 0,
        }),
      })
      await setupPublisherPermissions({
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      // Act
      const cancelScheduleCaller = caller.cancelSchedulePage({
        siteId: site.id,
        pageId: Number(expectedPage.id) + 1, // Invalid pageId should lead to an error being thrown
      })

      // Assert
      await expect(cancelScheduleCaller).rejects.toThrowError(
        new TRPCError({ code: "BAD_REQUEST", message: "Resource not found" }),
      )
    })
  })
})
