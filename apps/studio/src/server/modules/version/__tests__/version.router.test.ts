import type { IsomerSchema } from "@opengovsg/isomer-components"
import { TRPCError } from "@trpc/server"
import { auth } from "tests/integration/helpers/auth"
import { resetTables } from "tests/integration/helpers/db"
import {
  applyAuthedSession,
  createMockRequest,
} from "tests/integration/helpers/iron-session"
import {
  setupAdminPermissions,
  setupPageResource,
  setupUser,
} from "tests/integration/helpers/seed"
import { createCallerFactory } from "~/server/trpc"

import type { User } from "../../database"
import { db, jsonb } from "../../database"
import { versionRouter } from "../version.router"

const createCaller = createCallerFactory(versionRouter)

const makeContent = (text: string): IsomerSchema => ({
  page: { title: "Page", permalink: "page" },
  layout: "content",
  version: "0.1.0",
  content: [
    {
      type: "prose",
      content: [{ type: "paragraph", content: [{ type: "text", text }] }],
    },
  ],
})

const addVersion = async ({
  resourceId,
  versionNum,
  text,
  publishedBy,
}: {
  resourceId: string
  versionNum: number
  text: string
  publishedBy: string
}) => {
  const blob = await db
    .insertInto("Blob")
    .values({ content: jsonb(makeContent(text)) })
    .returning("id")
    .executeTakeFirstOrThrow()
  return db
    .insertInto("Version")
    .values({ versionNum, resourceId, blobId: blob.id, publishedBy })
    .returning("id")
    .executeTakeFirstOrThrow()
}

describe("version.router", async () => {
  let caller: ReturnType<typeof createCaller>
  const session = await applyAuthedSession()
  let user: User

  beforeEach(async () => {
    await resetTables(
      "AuditLog",
      "IsomerAdmin",
      "ResourcePermission",
      "Blob",
      "Version",
      "Resource",
      "Site",
      "User",
    )
    user = await setupUser({
      userId: session.userId,
      email: "test@mock.com",
      name: "Alice",
    })
    await auth(user)
    caller = createCaller(createMockRequest(session))
  })

  describe("listHistory", () => {
    it("returns versions newest first, each paired with the previous version's content", async () => {
      // Arrange
      const { page } = await setupPageResource({ resourceType: "Page" })
      await setupAdminPermissions({ userId: user.id, siteId: page.siteId })
      await addVersion({
        resourceId: page.id,
        versionNum: 1,
        text: "one",
        publishedBy: user.id,
      })
      await addVersion({
        resourceId: page.id,
        versionNum: 2,
        text: "two",
        publishedBy: user.id,
      })
      await addVersion({
        resourceId: page.id,
        versionNum: 3,
        text: "three",
        publishedBy: user.id,
      })

      // Act
      const result = await caller.listHistory({
        pageId: Number(page.id),
        siteId: page.siteId,
        cursor: 0,
        limit: 10,
      })

      // Assert
      expect(result.items.map((item) => item.versionNum)).toEqual([3, 2, 1])
      expect(result.items[0]?.afterContent).toEqual(makeContent("three"))
      expect(result.items[0]?.beforeContent).toEqual(makeContent("two"))
      expect(result.items[1]?.beforeContent).toEqual(makeContent("one"))
      expect(result.items[0]?.publisher).toMatchObject({
        id: user.id,
        name: "Alice",
        email: "test@mock.com",
      })
      expect(result.nextOffset).toBeNull()
    })

    it("returns a null beforeContent for the first version", async () => {
      // Arrange
      const { page } = await setupPageResource({ resourceType: "Page" })
      await setupAdminPermissions({ userId: user.id, siteId: page.siteId })
      await addVersion({
        resourceId: page.id,
        versionNum: 1,
        text: "one",
        publishedBy: user.id,
      })

      // Act
      const result = await caller.listHistory({
        pageId: Number(page.id),
        siteId: page.siteId,
        cursor: 0,
        limit: 10,
      })

      // Assert
      expect(result.items).toHaveLength(1)
      expect(result.items[0]?.beforeContent).toBeNull()
    })

    it("paginates, still pairing the last row of a page with the next page's first version", async () => {
      // Arrange
      const { page } = await setupPageResource({ resourceType: "Page" })
      await setupAdminPermissions({ userId: user.id, siteId: page.siteId })
      for (const [versionNum, text] of [
        [1, "one"],
        [2, "two"],
        [3, "three"],
      ] as const) {
        await addVersion({
          resourceId: page.id,
          versionNum,
          text,
          publishedBy: user.id,
        })
      }

      // Act
      const firstPage = await caller.listHistory({
        pageId: Number(page.id),
        siteId: page.siteId,
        cursor: 0,
        limit: 2,
      })
      const secondPage = await caller.listHistory({
        pageId: Number(page.id),
        siteId: page.siteId,
        cursor: firstPage.nextOffset ?? 0,
        limit: 2,
      })

      // Assert
      expect(firstPage.items.map((item) => item.versionNum)).toEqual([3, 2])
      expect(firstPage.items[1]?.beforeContent).toEqual(makeContent("one"))
      expect(firstPage.nextOffset).toBe(2)
      expect(secondPage.items.map((item) => item.versionNum)).toEqual([1])
      expect(secondPage.items[0]?.beforeContent).toBeNull()
      expect(secondPage.nextOffset).toBeNull()
    })

    it("excludes versions of other resources, including on other sites", async () => {
      // Arrange
      const { page } = await setupPageResource({ resourceType: "Page" })
      const { page: otherPage } = await setupPageResource({
        resourceType: "Page",
        siteId: page.siteId,
        permalink: "other",
      })
      await setupAdminPermissions({ userId: user.id, siteId: page.siteId })
      await addVersion({
        resourceId: page.id,
        versionNum: 1,
        text: "mine",
        publishedBy: user.id,
      })
      await addVersion({
        resourceId: otherPage.id,
        versionNum: 1,
        text: "theirs",
        publishedBy: user.id,
      })

      // Act
      const result = await caller.listHistory({
        pageId: Number(page.id),
        siteId: page.siteId,
        cursor: 0,
        limit: 10,
      })
      // A caller with access to some other site must not reach this page's
      // versions by passing their own siteId.
      const { page: foreignPage } = await setupPageResource({
        resourceType: "Page",
        permalink: "foreign",
      })
      await setupAdminPermissions({
        userId: user.id,
        siteId: foreignPage.siteId,
      })
      const crossSite = await caller.listHistory({
        pageId: Number(page.id),
        siteId: foreignPage.siteId,
        cursor: 0,
        limit: 10,
      })

      // Assert
      expect(result.items).toHaveLength(1)
      expect(result.items[0]?.afterContent).toEqual(makeContent("mine"))
      expect(crossSite.items).toHaveLength(0)
    })

    it("throws FORBIDDEN if the user has no permission on the site", async () => {
      // Arrange
      const { page } = await setupPageResource({ resourceType: "Page" })

      // Act
      const result = caller.listHistory({
        pageId: Number(page.id),
        siteId: page.siteId,
        cursor: 0,
        limit: 10,
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
})
