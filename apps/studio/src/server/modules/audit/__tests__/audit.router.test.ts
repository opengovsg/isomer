import type { IsomerSchema } from "@opengovsg/isomer-components"
import { TRPCError } from "@trpc/server"
import { pick } from "lodash-es"
import { auth } from "tests/integration/helpers/auth"
import { resetTables } from "tests/integration/helpers/db"
import {
  applyAuthedSession,
  applySession,
  createMockRequest,
} from "tests/integration/helpers/iron-session"
import {
  setupAdminPermissions,
  setupEditorPermissions,
  setupIsomerAdmin,
  setupPageResource,
  setupSite,
  setupUser,
} from "tests/integration/helpers/seed"
import { getCurrentSingaporeMonth } from "~/schemas/audit"
import { createCallerFactory } from "~/server/trpc"

import type { User } from "../../database"
import { db, jsonb } from "../../database"
import { pageRouter } from "../../page/page.router"
import { auditRouter } from "../audit.router"
import { getMonthDateRange } from "../auditLogExport.query"

const createCaller = createCallerFactory(auditRouter)
const createPageCaller = createCallerFactory(pageRouter)

// A month inside the allowed export window. The current Singapore-time month
// is always valid: never in the future, and within the 12-month window — so
// the happy-path tests don't rot as real time advances.
const VALID_MONTH = getCurrentSingaporeMonth()

// All AuditLogExportRequest rows for a (site, user), oldest-id first. Tables
// are reset per test, so this is every row the test created. Deliberately not
// filtered by the stored daterange: rejected inputs (e.g. a future month) must
// leave ZERO rows behind.
const getRequestRows = async ({
  siteId,
  userId,
}: {
  siteId: number
  userId: string
}) => {
  return db
    .selectFrom("AuditLogExportRequest")
    .where("siteId", "=", siteId)
    .where("userId", "=", userId)
    .orderBy("id", "asc")
    .selectAll()
    .execute()
}

// Every accepted ask — including an idempotent-accepted duplicate — must be
// recorded as an AuditLogExportCreate event. Rejected asks (FORBIDDEN/
// BAD_REQUEST) must leave no event behind.
const getExportCreateEvents = async ({ siteId }: { siteId: number }) => {
  return db
    .selectFrom("AuditLog")
    .where("siteId", "=", siteId)
    .where("eventType", "=", "AuditLogExportCreate")
    .orderBy("id", "asc")
    .selectAll()
    .execute()
}

describe("audit.router", async () => {
  let caller: ReturnType<typeof createCaller>
  const session = await applyAuthedSession()
  let user: User

  beforeAll(() => {
    caller = createCaller(createMockRequest(session))
  })

  beforeEach(async () => {
    await resetTables(
      "AuditLogExportRequest",
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
    })
    await auth(user)
    caller = createCaller(createMockRequest(session))
  })

  describe("createExportRequest", () => {
    it("should throw 401 if not logged in", async () => {
      // Arrange
      const unauthedSession = applySession()
      const unauthedCaller = createCaller(createMockRequest(unauthedSession))
      const { site } = await setupSite()

      // Act
      const result = unauthedCaller.createExportRequest({
        scope: "site",
        siteId: site.id,
        month: VALID_MONTH,
        reportType: "Access",
      })

      // Assert
      await expect(result).rejects.toThrow(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should create a single Pending request for a concrete report type", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = await caller.createExportRequest({
        scope: "site",
        siteId: site.id,
        month: VALID_MONTH,
        reportType: "Access",
      })

      // Assert: one inserted row, stored as the daterange derived from the
      // picked month, and returned as an array (the fan-out contract).
      const auditLogDateRange = getMonthDateRange(VALID_MONTH, new Date())
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        siteId: site.id,
        userId: session.userId,
        auditLogDateRange,
        reportType: "Access",
        status: "Pending",
        attempts: 0,
      })
      expect(result[0]?.id).toBeDefined()

      const rows = await getRequestRows({
        siteId: site.id,
        userId: session.userId!,
      })
      expect(rows).toHaveLength(1)

      // The ask itself is audit-logged: one AuditLogExportCreate event whose
      // delta records what was asked for (the requested type, verbatim).
      const events = await getExportCreateEvents({ siteId: site.id })
      expect(events).toHaveLength(1)
      expect(events[0]).toMatchObject({
        userId: session.userId,
        siteId: site.id,
        delta: {
          before: null,
          after: { auditLogDateRange, reportType: "Access" },
        },
      })
    })

    it("should allow an Isomer Admin without a site permission to request an export", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupIsomerAdmin({ userId: session.userId! })

      // Act
      const result = await caller.createExportRequest({
        scope: "site",
        siteId: site.id,
        month: VALID_MONTH,
        reportType: "Access",
      })

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        siteId: site.id,
        userId: session.userId,
        reportType: "Access",
        status: "Pending",
      })
    })

    it("records the requester IP on the AuditLogExportCreate event", async () => {
      // Arrange: a caller whose request carries a forwarded client IP, the same
      // way our edge/proxy sets it in production (see getClientIp).
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })
      const ipCaller = createCaller(
        createMockRequest(session, {
          method: "GET",
          headers: { "x-forwarded-for": "203.0.113.7" },
        }),
      )

      // Act
      await ipCaller.createExportRequest({
        scope: "site",
        siteId: site.id,
        month: VALID_MONTH,
        reportType: "Access",
      })

      // Assert: the event captures the requester IP, not null — matching the
      // provenance that sibling resource/permission/login events record.
      const events = await getExportCreateEvents({ siteId: site.id })
      expect(events).toHaveLength(1)
      expect(events[0]).toMatchObject({
        userId: session.userId,
        siteId: site.id,
        ipAddress: "203.0.113.7",
      })
    })

    it("should throw FORBIDDEN when the caller is only an Editor", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupEditorPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = caller.createExportRequest({
        scope: "site",
        siteId: site.id,
        month: VALID_MONTH,
        reportType: "Access",
      })

      // Assert
      await expect(result).rejects.toMatchObject({ code: "FORBIDDEN" })
      const rows = await getRequestRows({
        siteId: site.id,
        userId: session.userId!,
      })
      expect(rows).toHaveLength(0)
    })

    it("should throw FORBIDDEN when the caller has no permission on the site", async () => {
      // Arrange
      const { site } = await setupSite()

      // Act
      const result = caller.createExportRequest({
        scope: "site",
        siteId: site.id,
        month: VALID_MONTH,
        reportType: "Activity",
      })

      // Assert
      await expect(result).rejects.toMatchObject({ code: "FORBIDDEN" })
      const rows = await getRequestRows({
        siteId: site.id,
        userId: session.userId!,
      })
      expect(rows).toHaveLength(0)
    })

    it("should accept a duplicate ask idempotently, returning the in-flight row and recording a second event", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act — first request queues a row
      const first = await caller.createExportRequest({
        scope: "site",
        siteId: site.id,
        month: VALID_MONTH,
        reportType: "Access",
      })

      // Act — second identical request succeeds instead of erroring
      const second = await caller.createExportRequest({
        scope: "site",
        siteId: site.id,
        month: VALID_MONTH,
        reportType: "Access",
      })

      // Assert: the duplicate resolves to the SAME in-flight row (no second
      // row is queued)...
      expect(second).toHaveLength(1)
      expect(second[0]?.id).toBe(first[0]?.id)
      const rows = await getRequestRows({
        siteId: site.id,
        userId: session.userId!,
      })
      expect(rows).toHaveLength(1)

      // ...but the duplicate ASK is still recorded: one event per ask.
      const events = await getExportCreateEvents({ siteId: site.id })
      expect(events).toHaveLength(2)
    })

    it("should throw BAD_REQUEST when the month is in the future", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })

      // Act
      const result = caller.createExportRequest({
        scope: "site",
        siteId: site.id,
        month: "2999-12",
        reportType: "Activity",
      })

      // Assert
      await expect(result).rejects.toMatchObject({ code: "BAD_REQUEST" })
      const rows = await getRequestRows({
        siteId: site.id,
        userId: session.userId!,
      })
      expect(rows).toHaveLength(0)
    })

    it("should throw BAD_REQUEST when the month is older than the 12-month window", async () => {
      // Arrange
      const { site } = await setupSite()
      await setupAdminPermissions({
        userId: session.userId,
        siteId: site.id,
      })
      const tooOldMonth = "2000-01"

      // Act
      const result = caller.createExportRequest({
        scope: "site",
        siteId: site.id,
        month: tooOldMonth,
        reportType: "Activity",
      })

      // Assert
      await expect(result).rejects.toMatchObject({ code: "BAD_REQUEST" })
      const rows = await getRequestRows({
        siteId: site.id,
        userId: session.userId!,
      })
      expect(rows).toHaveLength(0)
    })

    describe("allSites scope", () => {
      it("fans out across every site the caller Admins, skipping sites without permission", async () => {
        // Arrange: caller is Admin on two sites, has no permission on a third.
        const { site: adminSiteA } = await setupSite()
        const { site: adminSiteB } = await setupSite()
        const { site: otherSite } = await setupSite()
        await setupAdminPermissions({
          userId: session.userId,
          siteId: adminSiteA.id,
        })
        await setupAdminPermissions({
          userId: session.userId,
          siteId: adminSiteB.id,
        })

        // Act
        const result = await caller.createExportRequest({
          scope: "allSites",
          month: VALID_MONTH,
          reportType: "Activity",
        })

        // Assert: one row per admin site, none for the site without permission.
        expect(result).toHaveLength(2)
        expect(result.map((row) => row.siteId).sort((a, b) => a - b)).toEqual(
          [adminSiteA.id, adminSiteB.id].sort((a, b) => a - b),
        )

        const otherSiteRows = await getRequestRows({
          siteId: otherSite.id,
          userId: session.userId!,
        })
        expect(otherSiteRows).toHaveLength(0)

        // One AuditLogExportCreate event per site, not one ambiguous event
        // for the whole ask.
        const eventsA = await getExportCreateEvents({ siteId: adminSiteA.id })
        const eventsB = await getExportCreateEvents({ siteId: adminSiteB.id })
        expect(eventsA).toHaveLength(1)
        expect(eventsB).toHaveLength(1)
      })

      it("fans out across every site in the DB for an Isomer Admin", async () => {
        // Arrange: two sites exist; the caller has no explicit permission on
        // either, only their (implicit, Isomer-wide) Admin status.
        const { site: siteA } = await setupSite()
        const { site: siteB } = await setupSite()
        await setupIsomerAdmin({ userId: session.userId! })

        // Act
        const result = await caller.createExportRequest({
          scope: "allSites",
          month: VALID_MONTH,
          reportType: "Activity",
        })

        // Assert
        expect(result).toHaveLength(2)
        expect(result.map((row) => row.siteId).sort((a, b) => a - b)).toEqual(
          [siteA.id, siteB.id].sort((a, b) => a - b),
        )
      })

      it("throws FORBIDDEN when the caller is not an Admin on any site", async () => {
        // Arrange: a site exists, but the caller has no permission on it and
        // is not an Isomer Admin.
        await setupSite()

        // Act
        const result = caller.createExportRequest({
          scope: "allSites",
          month: VALID_MONTH,
          reportType: "Activity",
        })

        // Assert
        await expect(result).rejects.toMatchObject({ code: "FORBIDDEN" })
      })
    })
  })

  describe("listResourceUpdates", () => {
    const BLOCKS_A: IsomerSchema["content"] = [
      {
        type: "prose",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "First revision" }],
          },
        ],
      },
    ]
    const BLOCKS_B: IsomerSchema["content"] = [
      {
        type: "prose",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Second revision" }],
          },
        ],
      },
    ]

    const createUpdateArgs = (
      page: Awaited<ReturnType<typeof setupPageResource>>["page"],
      blocks: IsomerSchema["content"],
    ) => ({
      pageId: Number(page.id),
      siteId: page.siteId,
      content: JSON.stringify({
        content: blocks,
        layout: "content",
        page: pick(page, ["title", "permalink"]),
        version: "0.1.0",
      }),
    })

    it("returns only ResourceUpdate rows where the blob content actually changed, newest first", async () => {
      // Arrange
      const { page } = await setupPageResource({ resourceType: "Page" })
      await setupAdminPermissions({
        userId: session.userId ?? undefined,
        siteId: page.siteId,
      })
      const pageCaller = createPageCaller(createMockRequest(session))

      await pageCaller.updatePageBlob(createUpdateArgs(page, BLOCKS_A))
      // Re-saving identical content must not appear in the history list.
      await pageCaller.updatePageBlob(createUpdateArgs(page, BLOCKS_A))
      await pageCaller.updatePageBlob(createUpdateArgs(page, BLOCKS_B))

      // Act
      const result = await caller.listResourceUpdates({
        pageId: Number(page.id),
        siteId: page.siteId,
        cursor: 0,
        limit: 10,
      })

      // Assert
      expect(result.items).toHaveLength(2)
      expect(result.items[0]?.afterContent.content).toEqual(BLOCKS_B)
      expect(result.items[1]?.afterContent.content).toEqual(BLOCKS_A)
      expect(result.nextOffset).toBeNull()
    })

    it("paginates with cursor/limit", async () => {
      // Arrange
      const { page } = await setupPageResource({ resourceType: "Page" })
      await setupAdminPermissions({
        userId: session.userId ?? undefined,
        siteId: page.siteId,
      })
      const pageCaller = createPageCaller(createMockRequest(session))
      await pageCaller.updatePageBlob(createUpdateArgs(page, BLOCKS_A))
      await pageCaller.updatePageBlob(createUpdateArgs(page, BLOCKS_B))

      // Act
      const firstPage = await caller.listResourceUpdates({
        pageId: Number(page.id),
        siteId: page.siteId,
        cursor: 0,
        limit: 1,
      })
      const secondPage = await caller.listResourceUpdates({
        pageId: Number(page.id),
        siteId: page.siteId,
        cursor: firstPage.nextOffset ?? 0,
        limit: 1,
      })

      // Assert
      expect(firstPage.items).toHaveLength(1)
      expect(firstPage.items[0]?.afterContent.content).toEqual(BLOCKS_B)
      expect(firstPage.nextOffset).toBe(1)
      expect(secondPage.items).toHaveLength(1)
      expect(secondPage.items[0]?.afterContent.content).toEqual(BLOCKS_A)
      expect(secondPage.nextOffset).toBeNull()
    })

    it("throws FORBIDDEN if the user has no permission on the site", async () => {
      // Arrange
      const { page } = await setupPageResource({ resourceType: "Page" })

      // Act
      const result = caller.listResourceUpdates({
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

    it("excludes ResourceUpdate rows belonging to a different resource on the same site", async () => {
      // Arrange: two pages under the same site — page two is saved twice
      // (once as a no-op re-save's counterpart, once as a real edit) and must
      // never leak into page one's history.
      const { page: pageOne } = await setupPageResource({
        resourceType: "Page",
      })
      const { page: pageTwo } = await setupPageResource({
        resourceType: "Page",
        siteId: pageOne.siteId,
        permalink: "page-two",
      })
      await setupAdminPermissions({
        userId: session.userId ?? undefined,
        siteId: pageOne.siteId,
      })
      const pageCaller = createPageCaller(createMockRequest(session))

      await pageCaller.updatePageBlob(createUpdateArgs(pageOne, BLOCKS_A))
      await pageCaller.updatePageBlob(createUpdateArgs(pageTwo, BLOCKS_A))
      await pageCaller.updatePageBlob(createUpdateArgs(pageTwo, BLOCKS_B))

      // Act
      const result = await caller.listResourceUpdates({
        pageId: Number(pageOne.id),
        siteId: pageOne.siteId,
        cursor: 0,
        limit: 10,
      })

      // Assert: only page one's single update shows up — none of page two's,
      // even though they share a site.
      expect(result.items).toHaveLength(1)
      expect(result.items[0]?.afterContent.content).toEqual(BLOCKS_A)
    })

    it("silently drops a row whose delta doesn't match the expected blob.content shape", async () => {
      // Arrange: one well-formed update, plus a row that passes every
      // SQL-level filter (has 'blob' keys on both sides, with differing
      // 'blob.content') but whose `before.blob` isn't actually an object —
      // simulating a corrupted/legacy row. `updatePageBlob` can never
      // produce this shape, so it's inserted directly.
      const { page } = await setupPageResource({ resourceType: "Page" })
      await setupAdminPermissions({
        userId: session.userId ?? undefined,
        siteId: page.siteId,
      })
      const pageCaller = createPageCaller(createMockRequest(session))
      await pageCaller.updatePageBlob(createUpdateArgs(page, BLOCKS_A))

      const malformedDelta = {
        before: { blob: null, resource: { id: String(page.id) } },
        after: {
          blob: {
            content: {
              content: BLOCKS_B,
              layout: "content",
              page: pick(page, ["title", "permalink"]),
              version: "0.1.0",
            },
          },
          resource: { id: String(page.id) },
        },
      }
      await db
        .insertInto("AuditLog")
        .values({
          userId: user.id,
          siteId: page.siteId,
          eventType: "ResourceUpdate",
          metadata: jsonb({}),
          delta: jsonb(malformedDelta) as never,
        })
        .execute()

      // Act
      const result = await caller.listResourceUpdates({
        pageId: Number(page.id),
        siteId: page.siteId,
        cursor: 0,
        limit: 10,
      })

      // Assert: the malformed row is dropped, not thrown — only the
      // well-formed update from `updatePageBlob` survives.
      expect(result.items).toHaveLength(1)
      expect(result.items[0]?.afterContent.content).toEqual(BLOCKS_A)
    })
  })
})
