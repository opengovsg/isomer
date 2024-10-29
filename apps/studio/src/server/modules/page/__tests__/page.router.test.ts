import type { IsomerSchema } from "@opengovsg/isomer-components"
import type { z } from "zod"
import { ISOMER_PAGE_LAYOUTS } from "@opengovsg/isomer-components"
import { TRPCError } from "@trpc/server"
import { ResourceState } from "~prisma/generated/generatedEnums"
import { omit, pick } from "lodash"
import { resetTables } from "tests/integration/helpers/db"
import {
  applyAuthedSession,
  applySession,
  createMockRequest,
} from "tests/integration/helpers/iron-session"
import {
  setupAdminPermissions,
  setupFolder,
  setupPageResource,
  setupSite,
} from "tests/integration/helpers/seed"

import type { reorderBlobSchema, updatePageBlobSchema } from "~/schemas/page"
import { createCallerFactory } from "~/server/trpc"
import { db } from "../../database"
import { pageRouter } from "../page.router"
import { createDefaultPage } from "../page.service"

const createCaller = createCallerFactory(pageRouter)

describe("page.router", async () => {
  let caller: ReturnType<typeof createCaller>
  const session = await applyAuthedSession()

  beforeAll(() => {
    caller = createCaller(createMockRequest(session))
  })

  describe("readPage", () => {
    beforeEach(async () => {
      await resetTables("Site")
    })

    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      const result = unauthedCaller.readPage({
        siteId: 1,
        pageId: 1,
      })

      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return 404 if page does not exist", async () => {
      // Act
      const mockSite = {
        siteId: 1,
        pageId: 1,
      }
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
      await setupAdminPermissions({
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
      await setupAdminPermissions({
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
      await setupAdminPermissions({
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
      await setupAdminPermissions({
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
  })

  describe("readPageAndBlob", () => {
    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      const result = unauthedCaller.readPageAndBlob({
        siteId: 1,
        pageId: 1,
      })

      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return 404 if page does not exist", async () => {
      const mockSite = {
        siteId: 1,
        pageId: 1,
      }
      const site = await setupSite(mockSite.siteId)
      await setupAdminPermissions({
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
      await setupAdminPermissions({
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
      await setupAdminPermissions({
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
      await setupAdminPermissions({
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

    it("should return 404 if resource type is not a page", async () => {
      // Arrange
      const { site, folder } = await setupFolder()
      await setupAdminPermissions({
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

    it("should throw 401 if not logged in", async () => {
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
    })

    it("should return 404 if page does not exist", async () => {
      // Act
      const result = caller.reorderBlock({
        siteId: 1,
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
        new TRPCError({
          code: "UNPROCESSABLE_CONTENT",
        }),
      )
    })

    it("should fail validation if `from` arg is negative index", async () => {
      //Arrange
      await setupAdminPermissions({
        userId: session.userId ?? undefined,
        siteId: pageToReorder.site.id,
      })

      // Act
      const result = caller.reorderBlock({
        siteId: pageToReorder.site.id,
        pageId: Number(pageToReorder.page.id),
        from: -1,
        to: 1,
        blocks: pageToReorder.blob.content.content,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        "Number must be greater than or equal to 0",
      )
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
        new TRPCError({
          code: "UNPROCESSABLE_CONTENT",
        }),
      )
    })

    it("should fail validation if `to` arg is negative index", async () => {
      // Arrange
      await setupAdminPermissions({
        userId: session.userId ?? undefined,
        siteId: pageToReorder.site.id,
      })

      // Act
      const result = caller.reorderBlock({
        siteId: pageToReorder.site.id,
        pageId: Number(pageToReorder.page.id),
        from: 1,
        to: -1,
        blocks: pageToReorder.blob.content.content,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        "Number must be greater than or equal to 0",
      )
    })

    it("should reorder block if args are valid", async () => {
      // Arrange
      await setupAdminPermissions({
        userId: session.userId ?? undefined,
        siteId: pageToReorder.site.id,
      })

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
    })
  })

  describe("updatePageBlob", () => {
    const NEW_PAGE_BLOCKS: IsomerSchema["content"] = [
      {
        type: "prose",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "This is the new block",
              },
            ],
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
              content: [
                {
                  type: "text",
                  text: "Test Callout content",
                },
              ],
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
          layout: ISOMER_PAGE_LAYOUTS.Content,
          page: pick(page, ["title", "permalink"]),
          version: "0.1.0",
        } as UpdatePageOutput["content"]),
      }
    }

    beforeEach(async () => {
      const { page } = await setupPageResource({ resourceType: "Page" })
      pageToUpdate = page
    })

    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))
      const pageUpdateArgs = createPageUpdateArgs(pageToUpdate)
      const result = unauthedCaller.updatePageBlob(pageUpdateArgs)

      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
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
        new TRPCError({
          code: "NOT_FOUND",
          message: "Resource not found",
        }),
      )
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
    })

    it("should update draft page blob if args are valid and has current draft", async () => {
      // Arrange
      const pageUpdateArgs = createPageUpdateArgs(pageToUpdate)
      await setupAdminPermissions({
        userId: session.userId ?? undefined,
        siteId: pageToUpdate.siteId,
      })

      // Act
      const result = await caller.updatePageBlob(pageUpdateArgs)

      // Assert
      const actual = await db
        .selectFrom("Blob")
        .where("id", "=", pageToUpdate.draftBlobId)
        .select("content")
        .executeTakeFirstOrThrow()
      expect(actual.content).toEqual(result.content)
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
    })
  })

  describe("createPage", () => {
    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      const result = unauthedCaller.createPage({
        siteId: 1,
        title: "Test Page",
        permalink: "test-page",
        layout: ISOMER_PAGE_LAYOUTS.Content,
      })

      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return 404 if site does not exist", async () => {
      // Act
      const result = caller.createPage({
        siteId: 999999, // should not exist
        title: "Test Page",
        permalink: "test-page",
        layout: ISOMER_PAGE_LAYOUTS.Content,
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
        layout: ISOMER_PAGE_LAYOUTS.Content,
      })

      // Assert
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
        layout: ISOMER_PAGE_LAYOUTS.Content,
      })

      // Assert
      const actual = await db
        .selectFrom("Resource")
        .innerJoin("Blob", "Resource.draftBlobId", "Blob.id")
        .where("Resource.id", "=", result.pageId)
        .select(["title", "permalink", "type", "siteId", "Blob.content"])
        .executeTakeFirstOrThrow()
      expect(result).toMatchObject({
        pageId: expect.any(String),
      })
      expect(actual).toMatchObject({
        ...expectedPageArgs,
        content: createDefaultPage({ layout: ISOMER_PAGE_LAYOUTS.Content }),
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
        layout: ISOMER_PAGE_LAYOUTS.Article,
      })

      // Assert
      const actual = await db
        .selectFrom("Resource")
        .innerJoin("Blob", "Resource.draftBlobId", "Blob.id")
        .where("Resource.id", "=", result.pageId)
        .select(["title", "permalink", "type", "siteId", "Blob.content"])
        .executeTakeFirstOrThrow()
      expect(result).toMatchObject({
        pageId: expect.any(String),
      })
      expect(actual).toMatchObject({
        ...expectedPageArgs,
        content: createDefaultPage({ layout: ISOMER_PAGE_LAYOUTS.Article }),
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
      const result = await caller.createPage({
        ...expectedPageArgs,
      })

      // Assert
      const actual = await db
        .selectFrom("Resource")
        .innerJoin("Blob", "Resource.draftBlobId", "Blob.id")
        .where("Resource.id", "=", result.pageId)
        .select(["title", "permalink", "type", "siteId", "Blob.content"])
        .executeTakeFirstOrThrow()
      expect(result).toMatchObject({
        pageId: expect.any(String),
      })
      expect(actual).toMatchObject({
        ...expectedPageArgs,
        content: createDefaultPage({ layout: ISOMER_PAGE_LAYOUTS.Content }),
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
        layout: ISOMER_PAGE_LAYOUTS.Content,
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
      expect(result).toMatchObject({
        pageId: expect.any(String),
      })
      expect(actual).toMatchObject({
        ...expectedPageArgs,
        parentId: folder.id,
        content: createDefaultPage({ layout: ISOMER_PAGE_LAYOUTS.Content }),
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
      const result = caller.createPage({
        ...expectedPageArgs,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "Folder not found or folderId is not a folder",
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
      const result = caller.createPage({
        ...expectedPageArgs,
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "Folder not found or folderId is not a folder",
        }),
      )
    })

    // TODO: Implement tests when permissions are implemented
    it.skip("should throw 403 if user does not have access to site", async () => {})

    it.skip("should throw 403 if user does not have write access to folder", async () => {})

    it.skip("should throw 403 if user does not have write access to root", async () => {})
  })

  describe("getRootPage", () => {
    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      const result = unauthedCaller.getRootPage({
        siteId: 1,
      })

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
      await setupAdminPermissions({
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      // Act
      const result = await caller.getRootPage({
        siteId: site.id,
      })

      // Assert
      expect(result).toMatchObject(pick(page, ["id", "title", "draftBlobId"]))
    })

    it("should return 404 if root page does not exist", async () => {
      // Arrange
      const { site } = await setupSite()

      // Act
      const result = caller.getRootPage({
        siteId: site.id,
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

    it.skip("should throw 403 if user does not have access to site", async () => {})

    it.skip("should throw 403 if user does not have read access to root", async () => {})
  })

  // TODO: Implement tests when publish works
  describe.skip("publishPage", () => {
    it.skip("should trigger a publish automatically on creation of a folder", () => {})
    it.skip("should trigger a publish automatically on deletion of a folder", () => {})
    it.skip("should trigger a publish automatically on move of a folder", () => {})
    it.skip("should trigger a publish automatically on update of a folder's title", () => {})
    it.skip("should trigger a publish automatically on update of a folder's permalink", () => {})
    it.skip("should trigger a publish automatically on creation of a collection", () => {})
    it.skip("should trigger a publish automatically on deletion of a collection", () => {})
    it.skip("should trigger a publish automatically on update of a collection's title", () => {})
    it.skip("should trigger a publish automatically on update of a collection's permalink", () => {})
    it.skip("should trigger a publish automatically on move of a page", () => {})
    it.skip("should not trigger a publish if there is a currently running publish witin the past minute", () => {})
  })

  describe("updateSettings", () => {
    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      const result = unauthedCaller.updateSettings({
        siteId: 1,
        pageId: 1,
        title: "Test Page",
        permalink: "test-page",
        meta: "Test meta",
        type: "Page",
      })

      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return 404 if page does not exist", async () => {
      // Act
      const result = caller.updateSettings({
        siteId: 1,
        pageId: 1,
        title: "Test Page",
        permalink: "test-page",
        meta: "Test meta",
        type: "Page",
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

    it("should update page settings successfully", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: "Page",
      })
      const expectedMeta = {
        description: "Updating the meta description",
        noIndex: false,
      }
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
        meta: JSON.stringify(expectedMeta),
        type: "Page",
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
      const actualBlobContent = await db
        .selectFrom("Blob")
        .where("id", "=", page.draftBlobId)
        .select("content")
        .executeTakeFirstOrThrow()
      expect(result).toMatchObject(actualResource)
      expect(result).toMatchObject(expectedSettings)
      expect(actualBlobContent.content.meta).toMatchObject(expectedMeta)
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
      const expectedMeta = {
        description: "Updating the meta description",
        noIndex: false,
      }
      const expectedSettings = {
        title: "New Title",
        permalink: "",
      }

      // Act
      const result = await caller.updateSettings({
        siteId: site.id,
        pageId: Number(page.id),
        meta: JSON.stringify(expectedMeta),
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
      const actualBlobContent = await db
        .selectFrom("Blob")
        .where("id", "=", page.draftBlobId)
        .select("content")
        .executeTakeFirstOrThrow()
      expect(result).toMatchObject(actualResource)
      expect(result).toMatchObject(expectedSettings)
      expect(actualBlobContent.content.meta).toMatchObject(expectedMeta)
    })

    it("should fail validation if meta is incorrect shape", async () => {
      // Arrange
      const { site, page } = await setupPageResource({
        resourceType: "Page",
      })
      await setupAdminPermissions({
        userId: session.userId ?? undefined,
        siteId: site.id,
      })

      // Act
      const result = caller.updateSettings({
        siteId: site.id,
        pageId: Number(page.id),
        title: "New Title",
        permalink: "new-permalink",
        type: "Page",
        meta: "do not match the shape because not a json string",
      })

      // Assert
      await expect(result).rejects.toThrowError("Invalid metadata")
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
        meta: JSON.stringify({
          description: "Updating the meta description",
          noIndex: false,
        }),
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "CONFLICT",
          message: "A resource with the same permalink already exists",
        }),
      )
    })

    it.skip("should throw 403 if user does not have access to site", async () => {})

    it.skip("should throw 403 if user does not have write access to page", async () => {})
  })

  describe("getFullPermalink", () => {
    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      const result = unauthedCaller.getFullPermalink({
        siteId: 1,
        pageId: 1,
      })

      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return 404 if page does not exist", async () => {
      // Act
      const result = caller.getFullPermalink({
        siteId: 1,
        pageId: 99999,
      })

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
      const { site, page } = await setupPageResource({
        resourceType: "Page",
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

    it.skip("should throw 403 if user does not have access to site", async () => {})

    it.skip("should throw 403 if user does not have read access to page", async () => {})
  })

  describe("getPermalinkTree", () => {
    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      const result = unauthedCaller.getPermalinkTree({
        pageId: 1,
        siteId: 1,
      })

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
      const result = caller.getPermalinkTree({
        siteId: site.id,
        pageId: 99999,
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

    it.skip("should throw 403 if user does not have access to site", async () => {})

    it.skip("should throw 403 if user does not have read access to root", async () => {})
  })
})
