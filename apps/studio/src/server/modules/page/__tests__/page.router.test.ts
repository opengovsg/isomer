import type { IsomerSchema } from "@opengovsg/isomer-components"
import type { z } from "zod"
import { TRPCError } from "@trpc/server"
import {
  AuditLogEvent,
  ResourceState,
  ResourceType,
} from "~prisma/generated/generatedEnums"
import { omit, pick } from "lodash"
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

import type { User } from "../../database"
import type { reorderBlobSchema, updatePageBlobSchema } from "~/schemas/page"
import { createCallerFactory } from "~/server/trpc"
import { assertAuditLogRows } from "../../audit/__tests__/utils"
import { db } from "../../database"
import { getBlobOfResource } from "../../resource/resource.service"
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

  describe("list", () => {
    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      const result = unauthedCaller.list({
        siteId: 1,
      })

      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have read access to the site", async () => {
      // Arrange
      const { site } = await setupSite()

      const result = caller.list({
        siteId: site.id,
      })

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
      const result = await caller.list({
        siteId: site.id,
      })

      // Assert
      expect(result).toEqual([])
    })
  })

  describe("getCategories", () => {
    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      const result = unauthedCaller.getCategories({
        siteId: 1,
        pageId: 1,
      })

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

      const result = unauthedCaller.readPageAndBlob({
        siteId: 1,
        pageId: 1,
      })

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
      const mockSite = {
        siteId: 1,
        pageId: 1,
      }
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
        new TRPCError({
          code: "UNPROCESSABLE_CONTENT",
        }),
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
        new TRPCError({
          code: "UNPROCESSABLE_CONTENT",
        }),
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
        new TRPCError({
          code: "NOT_FOUND",
          message: "Resource not found",
        }),
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
        .execute((tx) => getBlobOfResource({ tx, resourceId: pageToUpdate.id }))

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
          getBlobOfResource({ tx, resourceId: publishedPageToUpdate.id }),
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
      await assertAuditLogRows()
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
      expect(result).toMatchObject({
        pageId: expect.any(String),
      })
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
      expect(result).toMatchObject({
        pageId: expect.any(String),
      })
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
      expect(result).toMatchObject({
        pageId: expect.any(String),
      })
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
      const result = caller.createPage({
        ...expectedPageArgs,
      })

      // Assert
      await assertAuditLogRows()
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
      await assertAuditLogRows()
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "BAD_REQUEST",
          message: "Folder not found or folderId is not a folder",
        }),
      )
    })

    // TODO: Implement tests when permissions are implemented
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
      await setupEditorPermissions({
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

    it("should return 403 if user does not have read access to root", async () => {
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

  describe("publishPage", () => {
    it("should throw 401 if not logged in", async () => {
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))

      const result = unauthedCaller.publishPage({
        siteId: 1,
        pageId: 1,
      })

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

      // Act
      const result = await caller.publishPage({
        siteId: site.id,
        pageId: Number(page.id),
      })

      // Assert
      expect(result).toEqual({
        versionId: expect.any(String),
        versionNum: expect.any(Number),
      })

      // Assert - DB (Version)
      const versions = await db
        .selectFrom("Version")
        .where("id", "=", result.versionId)
        .selectAll()
        .execute()
      expect(versions.length).toEqual(1)

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
        meta: JSON.stringify({
          description: "Test Meta",
        }),
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
        meta: JSON.stringify({
          description: "Test Meta",
        }),
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
      const { site, page } = await setupPageResource({
        resourceType: "Page",
      })
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
      const expectedSettings = {
        title: "New Title",
        permalink: "",
      }

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
      const { site, page } = await setupPageResource({
        resourceType: "Page",
      })
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

      const result = unauthedCaller.getFullPermalink({
        siteId: 1,
        pageId: 1,
      })

      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should return 404 if page does not exist", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({ userId: session.userId, siteId: site.id })

      // Act
      const result = caller.getFullPermalink({
        siteId: site.id,
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
      expect(result).toEqual({
        pageId: expect.any(String),
      })
    })
  })
})
