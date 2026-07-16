import { TRPCError } from "@trpc/server"
import { auth } from "tests/integration/helpers/auth"
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
  setupUser,
} from "tests/integration/helpers/seed"
import { createCallerFactory } from "~/server/trpc"
import { ResourceState, ResourceType } from "~prisma/generated/generatedEnums"

import * as codebuildService from "../../aws/codebuild.service"
import { db } from "../../database"
import { redirectRouter } from "../redirect.router"

const createCaller = createCallerFactory(redirectRouter)

describe("redirect.router", async () => {
  let caller: ReturnType<typeof createCaller>
  let unauthedCaller: ReturnType<typeof createCaller>
  let siteId: number
  let userId: string
  const session = await applyAuthedSession()

  beforeEach(async () => {
    await resetTables(
      "AuditLog",
      "Redirect",
      "Blob",
      "Version",
      "Resource",
      "ResourcePermission",
      "Whitelist",
      "Site",
      "User",
    )
    const user = await setupUser({
      userId: session.userId,
      email: "test@mock.com",
    })
    await auth(user)
    const { site } = await setupSite()
    siteId = site.id
    userId = user.id
    await setupAdminPermissions({ userId: user.id, siteId })
    caller = createCaller(createMockRequest(session))
    unauthedCaller = createCaller(createMockRequest(applySession()))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // Seeds a root page plus a child page at /{permalink} for the given site, so
  // a destination "/{permalink}" resolves to that page during validation.
  const seedPageAtRoot = async ({
    permalink,
    published,
  }: {
    permalink: string
    published: boolean
  }) => {
    // Top-level resources are stored with parentId = null in production (they
    // are NOT children of the RootPage's id), so seed them that way — otherwise
    // getResourceByFullPermalink can't resolve them.
    await setupPageResource({
      siteId,
      resourceType: ResourceType.RootPage,
      parentId: null,
    })
    const { page } = await setupPageResource({
      siteId,
      resourceType: ResourceType.Page,
      parentId: null,
      permalink,
      ...(published
        ? { state: ResourceState.Published, userId }
        : { state: ResourceState.Draft }),
    })
    return page
  }

  describe("list", () => {
    it("should throw 401 if not logged in", async () => {
      // Arrange / Act
      const result = unauthedCaller.list({ siteId })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have read access to the site", async () => {
      // Arrange
      const { site: otherSite } = await setupSite()

      // Act
      const result = caller.list({ siteId: otherSite.id })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it("should return empty list when no redirects exist", async () => {
      // Arrange / Act
      const result = await caller.list({ siteId })

      // Assert
      expect(result).toEqual([])
    })

    it("should return live redirects with correct shape", async () => {
      // Arrange
      await db
        .insertInto("Redirect")
        .values({ siteId, source: "/old", destination: "/new" })
        .execute()

      // Act
      const result = await caller.list({ siteId })

      // Assert
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        source: "/old",
        destination: "/new",
      })
      expect(result[0]!.publishedAt).toBeInstanceOf(Date)
      expect(typeof result[0]!.id).toBe("string")
    })

    it("should not return soft-deleted redirects", async () => {
      // Arrange
      await db
        .insertInto("Redirect")
        .values({
          siteId,
          source: "/removed",
          destination: "/gone",
          deletedAt: new Date(),
        })
        .execute()

      // Act
      const result = await caller.list({ siteId })

      // Assert
      expect(result).toHaveLength(0)
    })

    it("should not return redirects from other sites", async () => {
      // Arrange
      const { site: otherSite } = await setupSite()
      await db
        .insertInto("Redirect")
        .values({
          siteId: otherSite.id,
          source: "/other",
          destination: "/elsewhere",
        })
        .execute()

      // Act
      const result = await caller.list({ siteId })

      // Assert
      expect(result).toHaveLength(0)
    })

    it("should return the newest redirects first by default", async () => {
      // Arrange
      await db
        .insertInto("Redirect")
        .values([
          {
            siteId,
            source: "/oldest",
            destination: "/a",
            createdAt: new Date("2026-01-01"),
          },
          {
            siteId,
            source: "/newest",
            destination: "/b",
            createdAt: new Date("2026-03-01"),
          },
          {
            siteId,
            source: "/middle",
            destination: "/c",
            createdAt: new Date("2026-02-01"),
          },
        ])
        .execute()

      // Act
      const result = await caller.list({ siteId })

      // Assert
      expect(result.map((row) => row.source)).toEqual([
        "/newest",
        "/middle",
        "/oldest",
      ])
    })

    it("should paginate with limit and offset without overlapping pages", async () => {
      // Arrange
      await db
        .insertInto("Redirect")
        .values(
          Array.from({ length: 5 }, (_, index) => ({
            siteId,
            source: `/page-${index}`,
            destination: `/dest-${index}`,
            createdAt: new Date(2026, 0, index + 1),
          })),
        )
        .execute()

      // Act
      const firstPage = await caller.list({ siteId, limit: 2, offset: 0 })
      const secondPage = await caller.list({ siteId, limit: 2, offset: 2 })
      const lastPage = await caller.list({ siteId, limit: 2, offset: 4 })

      // Assert
      expect(firstPage).toHaveLength(2)
      expect(secondPage).toHaveLength(2)
      expect(lastPage).toHaveLength(1)
      const seen = [...firstPage, ...secondPage, ...lastPage].map(
        (row) => row.source,
      )
      expect(new Set(seen).size).toBe(5)
    })

    it("should sort by the requested field and direction", async () => {
      // Arrange
      await db
        .insertInto("Redirect")
        .values([
          // createdAt deliberately disagrees with the alphabetical order so
          // the sort provably happens on the requested field
          {
            siteId,
            source: "/banana",
            destination: "/1",
            createdAt: new Date("2026-03-01"),
          },
          {
            siteId,
            source: "/apple",
            destination: "/2",
            createdAt: new Date("2026-01-01"),
          },
          {
            siteId,
            source: "/cherry",
            destination: "/3",
            createdAt: new Date("2026-02-01"),
          },
        ])
        .execute()

      // Act
      const ascending = await caller.list({
        siteId,
        sortBy: "source",
        sortDirection: "asc",
      })
      const descending = await caller.list({
        siteId,
        sortBy: "source",
        sortDirection: "desc",
      })

      // Assert
      expect(ascending.map((row) => row.source)).toEqual([
        "/apple",
        "/banana",
        "/cherry",
      ])
      expect(descending.map((row) => row.source)).toEqual([
        "/cherry",
        "/banana",
        "/apple",
      ])
    })
  })

  describe("count", () => {
    it("should throw 401 if not logged in", async () => {
      // Arrange / Act
      const result = unauthedCaller.count({ siteId })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have read access to the site", async () => {
      // Arrange
      const { site: otherSite } = await setupSite()

      // Act
      const result = caller.count({ siteId: otherSite.id })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it("should count only live redirects for the site", async () => {
      // Arrange
      const { site: otherSite } = await setupSite()
      await db
        .insertInto("Redirect")
        .values([
          { siteId, source: "/one", destination: "/a" },
          { siteId, source: "/two", destination: "/b" },
          {
            siteId,
            source: "/deleted",
            destination: "/c",
            deletedAt: new Date(),
          },
          { siteId: otherSite.id, source: "/other", destination: "/d" },
        ])
        .execute()

      // Act
      const result = await caller.count({ siteId })

      // Assert
      expect(result).toBe(2)
    })
  })

  describe("validate", () => {
    it("should throw 401 if not logged in", async () => {
      // Arrange / Act
      const result = unauthedCaller.validate({
        siteId,
        source: "/old",
        destination: "/new",
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have read access to the site", async () => {
      // Arrange
      const { site: otherSite } = await setupSite()

      // Act
      const result = caller.validate({
        siteId: otherSite.id,
        source: "/old",
        destination: "/new",
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

    it("should report no issues for a redirect to an external URL", async () => {
      // Arrange / Act
      const result = await caller.validate({
        siteId,
        source: "/old",
        destination: "https://www.example.gov.sg/new",
      })

      // Assert
      expect(result).toEqual({ errors: [] })
    })

    it("should report no issues for a redirect to a published page", async () => {
      // Arrange
      await seedPageAtRoot({ permalink: "published-page", published: true })

      // Act
      const result = await caller.validate({
        siteId,
        source: "/old",
        destination: "/published-page",
      })

      // Assert
      expect(result).toEqual({ errors: [] })
    })

    it("should error when a live redirect already exists for the source", async () => {
      // Arrange
      await db
        .insertInto("Redirect")
        .values({ siteId, source: "/old", destination: "/somewhere" })
        .execute()

      // Act
      const result = await caller.validate({
        siteId,
        source: "/old",
        destination: "https://www.example.gov.sg",
      })

      // Assert
      expect(result.errors).toContainEqual({
        code: "ALREADY_EXISTS",
        message: "This page is already being redirected.",
      })
    })

    it("should error when the redirect would create a loop", async () => {
      // Arrange
      // /b already redirects to /a, so adding /a -> /b bounces straight back
      await db
        .insertInto("Redirect")
        .values({ siteId, source: "/b", destination: "/a" })
        .execute()

      // Act
      const result = await caller.validate({
        siteId,
        source: "/a",
        destination: "/b",
      })

      // Assert
      expect(result.errors).toContainEqual({
        code: "REDIRECT_LOOP",
        message: "This will trap visitors in a never-ending loop.",
        description:
          "/b already redirects to /a. Visitors will get stuck in between pages. Delete existing redirects or direct to a different page.",
      })
    })

    it("should detect a loop even when the existing destination has a trailing slash", async () => {
      // Arrange
      // Stored "/b -> /a/" must still loop with a new "/a -> /b" once the
      // stored destination is normalised for comparison.
      await db
        .insertInto("Redirect")
        .values({ siteId, source: "/b", destination: "/a/" })
        .execute()

      // Act
      const result = await caller.validate({
        siteId,
        source: "/a",
        destination: "/b",
      })

      // Assert
      expect(result.errors).toContainEqual(
        expect.objectContaining({ code: "REDIRECT_LOOP" }),
      )
    })

    it("should not flag a multi-hop cycle as a loop (only one hop is checked)", async () => {
      // Arrange — /b -> /c and /c -> /a already exist. Adding /a -> /b closes a
      // three-redirect cycle, but loop detection only looks one hop deep by
      // design, so it is allowed rather than flagged as a loop error.
      await db
        .insertInto("Redirect")
        .values([
          { siteId, source: "/b", destination: "/c" },
          { siteId, source: "/c", destination: "/a" },
        ])
        .execute()

      // Act
      const result = await caller.validate({
        siteId,
        source: "/a",
        destination: "/b",
      })

      // Assert
      expect(result.errors).not.toContainEqual(
        expect.objectContaining({ code: "REDIRECT_LOOP" }),
      )
    })

    it("should not flag a multi-hop chain that never returns to the source", async () => {
      // Arrange — /b -> /c -> /d terminates at /d, so adding /a -> /b chains but
      // does not loop, so it is allowed.
      await db
        .insertInto("Redirect")
        .values([
          { siteId, source: "/b", destination: "/c" },
          { siteId, source: "/c", destination: "/d" },
        ])
        .execute()

      // Act
      const result = await caller.validate({
        siteId,
        source: "/a",
        destination: "/b",
      })

      // Assert
      expect(result.errors).not.toContainEqual(
        expect.objectContaining({ code: "REDIRECT_LOOP" }),
      )
    })

    it("should not report ALREADY_EXISTS when only a soft-deleted redirect exists for the source", async () => {
      // Arrange
      await db
        .insertInto("Redirect")
        .values({
          siteId,
          source: "/old",
          destination: "/x",
          deletedAt: new Date(),
        })
        .execute()

      // Act
      const result = await caller.validate({
        siteId,
        source: "/old",
        destination: "https://www.example.gov.sg",
      })

      // Assert
      expect(result.errors).toEqual([])
    })

    it("should error when the source is the URL of a published page", async () => {
      // Arrange — a live page sits at /live-page; redirecting from there would
      // shadow it on the published site.
      await seedPageAtRoot({ permalink: "live-page", published: true })

      // Act
      const result = await caller.validate({
        siteId,
        source: "/live-page",
        destination: "/somewhere",
      })

      // Assert
      expect(result.errors).toContainEqual({
        code: "SOURCE_IS_EXISTING_PAGE",
        message:
          "A live page already uses this URL. The redirect would hide it. Move or unpublish that page first.",
      })
    })

    it("should not error when the source matches only an unpublished page", async () => {
      // Arrange — an unpublished page isn't live, so it can't be shadowed yet
      // (publishing it later is guarded on the page side).
      await seedPageAtRoot({ permalink: "draft-page", published: false })

      // Act
      const result = await caller.validate({
        siteId,
        source: "/draft-page",
        destination: "/somewhere",
      })

      // Assert
      expect(result.errors).toEqual([])
    })

    it("should error when the source is the URL of a live folder (published index)", async () => {
      // Arrange — a folder whose index page is published is live at "/folder",
      // so a redirect there would shadow it. Regression test: the source guard
      // must resolve top-level containers (parentId = null), not only pages.
      await setupPageResource({
        siteId,
        resourceType: ResourceType.RootPage,
        parentId: null,
      })
      const { folder } = await setupFolder({
        siteId,
        permalink: "folder",
        parentId: null,
      })
      await setupPageResource({
        siteId,
        resourceType: ResourceType.IndexPage,
        parentId: folder.id,
        state: ResourceState.Published,
        userId,
      })

      // Act
      const result = await caller.validate({
        siteId,
        source: "/folder",
        destination: "/somewhere",
      })

      // Assert
      expect(result.errors).toContainEqual({
        code: "SOURCE_IS_EXISTING_PAGE",
        message:
          "A live page already uses this URL. The redirect would hide it. Move or unpublish that page first.",
      })
    })
  })

  describe("create", () => {
    it("should throw 401 if not logged in", async () => {
      // Arrange / Act
      const result = unauthedCaller.create({
        siteId,
        source: "/old",
        destination: "/new",
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have update access to the site", async () => {
      // Arrange
      const { site: otherSite } = await setupSite()

      // Act
      const result = caller.create({
        siteId: otherSite.id,
        source: "/old",
        destination: "/new",
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

    it("should create a redirect that is immediately live", async () => {
      // Arrange / Act
      // An external destination is stored verbatim (only internal paths are
      // resolved to a page reference)
      await caller.create({
        siteId,
        source: "/old",
        destination: "https://example.com/new",
      })

      // Assert
      const result = await caller.list({ siteId })
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        source: "/old",
        destination: "https://example.com/new",
      })
    })

    it("should normalise the source before persisting", async () => {
      // Arrange / Act
      await caller.create({
        siteId,
        source: "old//path/",
        destination: "https://example.com/new",
      })

      // Assert
      const result = await caller.list({ siteId })
      expect(result[0]!.source).toBe("/old/path")
    })

    it("should persist an external destination unchanged", async () => {
      // Arrange / Act
      await caller.create({
        siteId,
        source: "/old",
        destination: "https://www.example.gov.sg/path/",
      })

      // Assert
      const result = await caller.list({ siteId })
      expect(result[0]!.destination).toBe("https://www.example.gov.sg/path/")
    })

    it("should throw 409 if a live redirect already exists for the source", async () => {
      // Arrange
      await db
        .insertInto("Redirect")
        .values({ siteId, source: "/page", destination: "/old-dest" })
        .execute()

      // Act
      const result = caller.create({
        siteId,
        source: "/page",
        destination: "https://example.com/new-dest",
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "CONFLICT",
          message: "A redirect already exists for /page",
        }),
      )
      const row = await db
        .selectFrom("Redirect")
        .select("destination")
        .where("siteId", "=", siteId)
        .where("source", "=", "/page")
        .executeTakeFirstOrThrow()
      expect(row.destination).toBe("/old-dest")
    })

    it("should revive a soft-deleted redirect for the same source", async () => {
      // Arrange
      await db
        .insertInto("Redirect")
        .values({
          siteId,
          source: "/revived",
          destination: "/old",
          deletedAt: new Date(),
        })
        .execute()

      // Act
      await caller.create({
        siteId,
        source: "/revived",
        destination: "https://example.com/new",
      })

      // Assert
      const result = await caller.list({ siteId })
      expect(result).toHaveLength(1)
      expect(result[0]).toMatchObject({
        source: "/revived",
        destination: "https://example.com/new",
      })
    })

    it("should throw 422 and create nothing if the redirect would loop", async () => {
      // Arrange
      // /b already redirects to /a, so creating /a -> /b would bounce back
      await db
        .insertInto("Redirect")
        .values({ siteId, source: "/b", destination: "/a" })
        .execute()

      // Act
      const result = caller.create({ siteId, source: "/a", destination: "/b" })

      // Assert
      await expect(result).rejects.toThrowError(
        "This will trap visitors in a never-ending loop.",
      )
      const rows = await db
        .selectFrom("Redirect")
        .select("source")
        .where("siteId", "=", siteId)
        .where("source", "=", "/a")
        .execute()
      expect(rows).toHaveLength(0)
    })

    it("should create a redirect that only closes a multi-hop cycle (loop check is one hop)", async () => {
      // Arrange — /b -> /c -> /a. Creating /a -> /b closes a 3-redirect cycle,
      // but the loop guard only looks one hop deep by design, so the create is
      // allowed (the preflight surfaces it as a non-blocking chain warning).
      await db
        .insertInto("Redirect")
        .values([
          { siteId, source: "/b", destination: "/c" },
          { siteId, source: "/c", destination: "/a" },
        ])
        .execute()

      // Act
      await caller.create({ siteId, source: "/a", destination: "/b" })

      // Assert
      const rows = await db
        .selectFrom("Redirect")
        .select("source")
        .where("siteId", "=", siteId)
        .where("source", "=", "/a")
        .where("deletedAt", "is", null)
        .execute()
      expect(rows).toHaveLength(1)
    })

    it("should throw 412 and create nothing if the source is a published page's URL", async () => {
      // Arrange — a live page sits at /live-page
      await seedPageAtRoot({ permalink: "live-page", published: true })

      // Act
      const result = caller.create({
        siteId,
        source: "/live-page",
        destination: "/somewhere",
      })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "PRECONDITION_FAILED",
          message:
            "A live page already uses this URL. The redirect would hide it. Move or unpublish that page first.",
        }),
      )
      const rows = await db
        .selectFrom("Redirect")
        .select("source")
        .where("siteId", "=", siteId)
        .where("source", "=", "/live-page")
        .execute()
      expect(rows).toHaveLength(0)
    })

    it("should block an uppercase source that lowercases onto a published page", async () => {
      // Arrange — the page lives at /live-page; "/Live-Page" lowercases to the
      // same URL and would shadow it, so it must be blocked too.
      await seedPageAtRoot({ permalink: "live-page", published: true })

      // Act
      const result = caller.create({
        siteId,
        source: "/Live-Page",
        destination: "https://example.com/somewhere",
      })

      // Assert
      await expect(result).rejects.toMatchObject({
        code: "PRECONDITION_FAILED",
      })
    })

    it("should create the redirect when only an unpublished page exists at the source", async () => {
      // Arrange — an unpublished page at /draft-page isn't live, so it can't be
      // shadowed; the redirect is allowed (publishing the page later is guarded
      // on the page side). An external destination keeps the focus on the
      // source check (an internal destination would need its own live page).
      await seedPageAtRoot({ permalink: "draft-page", published: false })

      // Act
      await caller.create({
        siteId,
        source: "/draft-page",
        destination: "https://www.example.gov.sg",
      })

      // Assert
      const result = await caller.list({ siteId })
      expect(result).toContainEqual(
        expect.objectContaining({
          source: "/draft-page",
          destination: "https://www.example.gov.sg",
        }),
      )
    })

    it("should create the redirect when the destination is itself a redirect source", async () => {
      // Arrange
      // /b is a live page (so it is a valid destination, resolved to a
      // reference), but also already redirects to /c. /a -> /b is a chain (a
      // warning, not a loop), so the create proceeds.
      await setupPageResource({
        siteId,
        resourceType: ResourceType.Page,
        permalink: "b",
        state: ResourceState.Published,
        userId,
      })
      await db
        .insertInto("Redirect")
        .values({ siteId, source: "/b", destination: "/c" })
        .execute()

      // Act
      await caller.create({ siteId, source: "/a", destination: "/b" })

      // Assert
      const result = await caller.list({ siteId })
      expect(result.map((row) => row.source)).toContain("/a")
    })

    it("should write a RedirectCreate audit log entry with the created row", async () => {
      // Arrange / Act
      await caller.create({
        siteId,
        source: "/hello",
        destination: "https://example.com/world",
      })

      // Assert
      const auditEntry = await db
        .selectFrom("AuditLog")
        .selectAll()
        .where("siteId", "=", siteId)
        .where("eventType", "=", "RedirectCreate")
        .executeTakeFirstOrThrow()
      expect(auditEntry.userId).toBe(session.userId)
      expect(auditEntry.delta).toMatchObject({
        before: null,
        after: { source: "/hello", destination: "https://example.com/world" },
      })
      // The site publish triggered by the create is audited separately
      const publishEntry = await db
        .selectFrom("AuditLog")
        .selectAll()
        .where("siteId", "=", siteId)
        .where("eventType", "=", "Publish")
        .executeTakeFirstOrThrow()
      expect(publishEntry.userId).toBe(session.userId)
    })

    it("should persist the redirect even if the site publish fails", async () => {
      // Arrange: publish runs after the create transaction commits, so a
      // failing publish must not roll back the saved redirect.
      const publishSpy = vi
        .spyOn(codebuildService, "publishSite")
        .mockRejectedValueOnce(new Error("CodeBuild unavailable"))

      // Act
      const result = caller.create({
        siteId,
        source: "/old",
        destination: "https://example.com/new",
      })

      // Assert
      await expect(result).rejects.toThrowError("CodeBuild unavailable")
      expect(publishSpy).toHaveBeenCalledOnce()
      const rows = await db
        .selectFrom("Redirect")
        .selectAll()
        .where("siteId", "=", siteId)
        .where("deletedAt", "is", null)
        .execute()
      expect(rows).toHaveLength(1)
      expect(rows[0]).toMatchObject({
        source: "/old",
        destination: "https://example.com/new",
      })
    })

    it("should log the soft-deleted row as the delta before when reviving", async () => {
      // Arrange
      await db
        .insertInto("Redirect")
        .values({
          siteId,
          source: "/revived",
          destination: "/old",
          deletedAt: new Date(),
        })
        .execute()

      // Act
      await caller.create({
        siteId,
        source: "/revived",
        destination: "https://example.com/new",
      })

      // Assert
      const auditEntry = await db
        .selectFrom("AuditLog")
        .selectAll()
        .where("siteId", "=", siteId)
        .where("eventType", "=", "RedirectCreate")
        .executeTakeFirstOrThrow()
      expect(auditEntry.delta).toMatchObject({
        before: { source: "/revived", destination: "/old" },
        after: { source: "/revived", destination: "https://example.com/new" },
      })
    })
  })

  describe("create — destination resolution", () => {
    it("should store an internal-path destination as a page reference", async () => {
      // Arrange
      const { page } = await setupPageResource({
        siteId,
        resourceType: ResourceType.Page,
        permalink: "target-page",
        state: ResourceState.Published,
        userId: session.userId,
      })

      // Act
      await caller.create({
        siteId,
        source: "/from",
        destination: "/target-page",
      })

      // Assert — the path is resolved to a [resource:...] reference so the
      // redirect follows the page if its permalink later changes
      const row = await db
        .selectFrom("Redirect")
        .select("destination")
        .where("siteId", "=", siteId)
        .where("source", "=", "/from")
        .executeTakeFirstOrThrow()
      expect(row.destination).toBe(`[resource:${siteId}:${page.id}]`)
    })

    it("should resolve a nested internal path to the child page reference", async () => {
      // Arrange
      const { folder } = await setupFolder({
        siteId,
        permalink: "parent-folder",
      })
      const { page } = await setupPageResource({
        siteId,
        resourceType: ResourceType.Page,
        permalink: "child-page",
        parentId: folder.id,
        state: ResourceState.Published,
        userId: session.userId,
      })

      // Act
      await caller.create({
        siteId,
        source: "/from",
        destination: "/parent-folder/child-page",
      })

      // Assert — the reverse walk matches each segment against its parent
      const row = await db
        .selectFrom("Redirect")
        .select("destination")
        .where("siteId", "=", siteId)
        .where("source", "=", "/from")
        .executeTakeFirstOrThrow()
      expect(row.destination).toBe(`[resource:${siteId}:${page.id}]`)
    })

    it("should keep an internal path with a query suffix as a literal path", async () => {
      // Arrange
      await setupPageResource({
        siteId,
        resourceType: ResourceType.Page,
        permalink: "target-page",
      })

      // Act — a path with a query string can't map to a single resource
      await caller.create({
        siteId,
        source: "/from",
        destination: "/target-page?ref=footer",
      })

      // Assert
      const row = await db
        .selectFrom("Redirect")
        .select("destination")
        .where("siteId", "=", siteId)
        .where("source", "=", "/from")
        .executeTakeFirstOrThrow()
      expect(row.destination).toBe("/target-page?ref=footer")
    })

    it("stores a literal path when the internal destination has no live page", async () => {
      // Arrange / Act — no page lives at /no-such-page. The preflight warns, but
      // create keeps the literal path so an admin can pre-create the redirect.
      await caller.create({
        siteId,
        source: "/from",
        destination: "/no-such-page",
      })

      // Assert
      const row = await db
        .selectFrom("Redirect")
        .select("destination")
        .where("siteId", "=", siteId)
        .where("source", "=", "/from")
        .executeTakeFirstOrThrow()
      expect(row.destination).toBe("/no-such-page")
    })

    it("stores a reference when the destination page exists but is unpublished", async () => {
      // Arrange — a draft page exists at /draft-page; it has no live URL yet, but
      // the redirect references it so it starts working once the page publishes
      const { page } = await setupPageResource({
        siteId,
        resourceType: ResourceType.Page,
        permalink: "draft-page",
        state: ResourceState.Draft,
      })

      // Act
      await caller.create({
        siteId,
        source: "/from",
        destination: "/draft-page",
      })

      // Assert — resolved to a [resource:...] reference, not kept literal
      const row = await db
        .selectFrom("Redirect")
        .select("destination")
        .where("siteId", "=", siteId)
        .where("source", "=", "/from")
        .executeTakeFirstOrThrow()
      expect(row.destination).toBe(`[resource:${siteId}:${page.id}]`)
    })

    it("should resolve the site root '/' to the RootPage reference", async () => {
      // Arrange — the published homepage (RootPage has an empty permalink)
      const { page: rootPage } = await setupPageResource({
        siteId,
        resourceType: ResourceType.RootPage,
        permalink: "",
        state: ResourceState.Published,
        userId: session.userId,
      })

      // Act
      await caller.create({ siteId, source: "/from", destination: "/" })

      // Assert
      const row = await db
        .selectFrom("Redirect")
        .select("destination")
        .where("siteId", "=", siteId)
        .where("source", "=", "/from")
        .executeTakeFirstOrThrow()
      expect(row.destination).toBe(`[resource:${siteId}:${rootPage.id}]`)
    })

    it("should store a folder destination as the folder reference, not its index page", async () => {
      // Arrange — a folder is served by its published IndexPage child, but the
      // published site keys the URL on the folder's id, so the redirect must
      // reference the folder itself.
      const { folder } = await setupFolder({ siteId, permalink: "about" })
      await setupPageResource({
        siteId,
        resourceType: ResourceType.IndexPage,
        permalink: "_index",
        parentId: folder.id,
        state: ResourceState.Published,
        userId: session.userId,
      })

      // Act
      await caller.create({ siteId, source: "/from", destination: "/about" })

      // Assert
      const row = await db
        .selectFrom("Redirect")
        .select("destination")
        .where("siteId", "=", siteId)
        .where("source", "=", "/from")
        .executeTakeFirstOrThrow()
      expect(row.destination).toBe(`[resource:${siteId}:${folder.id}]`)
    })

    it("stores the folder reference for a folder destination whose index page is unpublished", async () => {
      // Arrange — a folder whose index page is still a draft has no live URL yet,
      // but the redirect references the folder so it works once it's published
      const { folder } = await setupFolder({ siteId, permalink: "about" })
      await setupPageResource({
        siteId,
        resourceType: ResourceType.IndexPage,
        permalink: "_index",
        parentId: folder.id,
        state: ResourceState.Draft,
      })

      // Act
      await caller.create({
        siteId,
        source: "/from",
        destination: "/about",
      })

      // Assert — resolved to the folder reference, not kept literal
      const row = await db
        .selectFrom("Redirect")
        .select("destination")
        .where("siteId", "=", siteId)
        .where("source", "=", "/from")
        .executeTakeFirstOrThrow()
      expect(row.destination).toBe(`[resource:${siteId}:${folder.id}]`)
    })
  })

  describe("resolveReferences", () => {
    it("should throw 403 if user does not have read access to the site", async () => {
      // Arrange
      const { site: otherSite } = await setupSite()

      // Act
      const result = caller.resolveReferences({
        siteId: otherSite.id,
        references: [],
      })

      // Assert
      await expect(result).rejects.toMatchObject({ code: "FORBIDDEN" })
    })

    it("should resolve a reference to the page's current permalink", async () => {
      // Arrange
      const { page } = await setupPageResource({
        siteId,
        resourceType: ResourceType.Page,
        permalink: "target-page",
        state: ResourceState.Published,
        userId: session.userId,
      })
      const reference = `[resource:${siteId}:${page.id}]`

      // Act
      const result = await caller.resolveReferences({
        siteId,
        references: [reference],
      })

      // Assert
      expect(result).toEqual([
        { reference, permalink: "/target-page", warn: false },
      ])
    })

    it("should warn for a reference whose page exists but is not published", async () => {
      // Arrange — a draft page resolves to its permalink for display, but has no
      // live page behind it yet, so the redirect currently leads nowhere.
      const { page } = await setupPageResource({
        siteId,
        resourceType: ResourceType.Page,
        permalink: "draft-page",
      })
      const reference = `[resource:${siteId}:${page.id}]`

      // Act
      const result = await caller.resolveReferences({
        siteId,
        references: [reference],
      })

      // Assert
      expect(result).toEqual([
        { reference, permalink: "/draft-page", warn: true },
      ])
    })

    it("should resolve a nested reference to its full permalink", async () => {
      // Arrange
      const { folder } = await setupFolder({
        siteId,
        permalink: "parent-folder",
      })
      const { page } = await setupPageResource({
        siteId,
        resourceType: ResourceType.Page,
        permalink: "child-page",
        parentId: folder.id,
        state: ResourceState.Published,
        userId: session.userId,
      })
      const reference = `[resource:${siteId}:${page.id}]`

      // Act
      const result = await caller.resolveReferences({
        siteId,
        references: [reference],
      })

      // Assert
      expect(result).toEqual([
        { reference, permalink: "/parent-folder/child-page", warn: false },
      ])
    })

    it("should resolve an index page reference to its folder's permalink", async () => {
      // Arrange — an _index page represents its folder, so its segment is
      // dropped from the resolved permalink
      const { folder } = await setupFolder({ siteId, permalink: "info" })
      const { page: indexPage } = await setupPageResource({
        siteId,
        resourceType: ResourceType.IndexPage,
        permalink: "_index",
        parentId: folder.id,
        state: ResourceState.Published,
        userId: session.userId,
      })
      const reference = `[resource:${siteId}:${indexPage.id}]`

      // Act
      const result = await caller.resolveReferences({
        siteId,
        references: [reference],
      })

      // Assert
      expect(result).toEqual([{ reference, permalink: "/info", warn: false }])
    })

    it("should resolve a deleted page's reference to null and warn", async () => {
      // Arrange — a reference to a resource that doesn't exist
      const reference = `[resource:${siteId}:999999]`

      // Act
      const result = await caller.resolveReferences({
        siteId,
        references: [reference],
      })

      // Assert
      expect(result).toEqual([{ reference, permalink: null, warn: true }])
    })

    it("should resolve a reference whose embedded siteId is not this site to null and warn", async () => {
      // Arrange — the resourceId exists on this site, but the reference claims a
      // different site, so it must not resolve here.
      const { page } = await setupPageResource({
        siteId,
        resourceType: ResourceType.Page,
        permalink: "target-page",
      })
      const reference = `[resource:${siteId + 1}:${page.id}]`

      // Act
      const result = await caller.resolveReferences({
        siteId,
        references: [reference],
      })

      // Assert
      expect(result).toEqual([{ reference, permalink: null, warn: true }])
    })

    it("should not resolve or warn for an external URL destination", async () => {
      // Arrange — external URLs aren't internal destinations; they never warn.
      const reference = "https://www.example.gov.sg/page"

      // Act
      const result = await caller.resolveReferences({
        siteId,
        references: [reference],
      })

      // Assert
      expect(result).toEqual([{ reference, permalink: null, warn: false }])
    })

    it("should not warn for a literal path to a published page (no permalink echoed)", async () => {
      // Arrange — a literal "/path" destination shows as typed (permalink stays
      // null), and only warns when it has no published page behind it.
      await setupPageResource({
        siteId,
        resourceType: ResourceType.RootPage,
        parentId: null,
      })
      await setupPageResource({
        siteId,
        resourceType: ResourceType.Page,
        parentId: null,
        permalink: "leaf",
        state: ResourceState.Published,
        userId,
      })

      // Act
      const result = await caller.resolveReferences({
        siteId,
        references: ["/leaf"],
      })

      // Assert
      expect(result).toEqual([
        { reference: "/leaf", permalink: null, warn: false },
      ])
    })

    it("should not warn for a literal path to a published page carrying a #fragment", async () => {
      // Arrange — a literal destination may keep a "#fragment"; resolution must
      // strip it and still find the underlying published page.
      await setupPageResource({
        siteId,
        resourceType: ResourceType.RootPage,
        parentId: null,
      })
      await setupPageResource({
        siteId,
        resourceType: ResourceType.Page,
        parentId: null,
        permalink: "leaf",
        state: ResourceState.Published,
        userId,
      })

      // Act
      const result = await caller.resolveReferences({
        siteId,
        references: ["/leaf#section"],
      })

      // Assert
      expect(result).toEqual([
        { reference: "/leaf#section", permalink: null, warn: false },
      ])
    })

    it("should warn for a literal path to an unpublished page", async () => {
      // Arrange
      await setupPageResource({
        siteId,
        resourceType: ResourceType.RootPage,
        parentId: null,
      })
      await setupPageResource({
        siteId,
        resourceType: ResourceType.Page,
        parentId: null,
        permalink: "draft-leaf",
      })

      // Act
      const result = await caller.resolveReferences({
        siteId,
        references: ["/draft-leaf"],
      })

      // Assert
      expect(result).toEqual([
        { reference: "/draft-leaf", permalink: null, warn: true },
      ])
    })

    it("should warn for a literal path that matches no page", async () => {
      // Arrange / Act
      const result = await caller.resolveReferences({
        siteId,
        references: ["/missing"],
      })

      // Assert
      expect(result).toEqual([
        { reference: "/missing", permalink: null, warn: true },
      ])
    })

    it("should not warn for a folder whose index page is published", async () => {
      // Arrange — "/folder" is served by the folder's published IndexPage, so it
      // resolves as published (exercises the folder -> IndexPage branch).
      await setupPageResource({
        siteId,
        resourceType: ResourceType.RootPage,
        parentId: null,
      })
      const { folder } = await setupFolder({
        siteId,
        permalink: "folder",
        parentId: null,
      })
      await setupPageResource({
        siteId,
        resourceType: ResourceType.IndexPage,
        parentId: folder.id,
        state: ResourceState.Published,
        userId,
      })

      // Act
      const result = await caller.resolveReferences({
        siteId,
        references: ["/folder"],
      })

      // Assert
      expect(result).toEqual([
        { reference: "/folder", permalink: null, warn: false },
      ])
    })

    it("should warn for a folder whose index page is not published", async () => {
      // Arrange — a folder with an unpublished IndexPage has no live page at its
      // URL, so it warns.
      await setupPageResource({
        siteId,
        resourceType: ResourceType.RootPage,
        parentId: null,
      })
      const { folder } = await setupFolder({
        siteId,
        permalink: "folder",
        parentId: null,
      })
      await setupPageResource({
        siteId,
        resourceType: ResourceType.IndexPage,
        parentId: folder.id,
      })

      // Act
      const result = await caller.resolveReferences({
        siteId,
        references: ["/folder"],
      })

      // Assert
      expect(result).toEqual([
        { reference: "/folder", permalink: null, warn: true },
      ])
    })
  })

  describe("delete", () => {
    it("should throw 401 if not logged in", async () => {
      // Arrange / Act
      const result = unauthedCaller.delete({ siteId, id: "1" })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "UNAUTHORIZED" }),
      )
    })

    it("should throw 403 if user does not have update access to the site", async () => {
      // Arrange
      const { site: otherSite } = await setupSite()

      // Act
      const result = caller.delete({ siteId: otherSite.id, id: "1" })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({
          code: "FORBIDDEN",
          message:
            "You do not have sufficient permissions to perform this action",
        }),
      )
    })

    it("should soft-delete the redirect", async () => {
      // Arrange
      const inserted = await db
        .insertInto("Redirect")
        .values({ siteId, source: "/remove-me", destination: "/dest" })
        .returning("id")
        .executeTakeFirstOrThrow()

      // Act
      await caller.delete({ siteId, id: inserted.id })

      // Assert
      const result = await caller.list({ siteId })
      expect(result).toHaveLength(0)
      const row = await db
        .selectFrom("Redirect")
        .select("deletedAt")
        .where("id", "=", inserted.id)
        .executeTakeFirstOrThrow()
      expect(row.deletedAt).not.toBeNull()
    })

    it("should throw 404 if the redirect does not exist", async () => {
      // Arrange / Act
      const result = caller.delete({ siteId, id: "999999" })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "NOT_FOUND", message: "Redirect not found" }),
      )
    })

    it("should throw 400 if the redirect id is not numeric", async () => {
      // Arrange / Act
      // Redirect.id is a bigint, so a non-numeric id must be rejected by
      // validation instead of becoming a DB cast error (500)
      const result = caller.delete({ siteId, id: "not-a-number" })

      // Assert
      // Assert the code, not the message — a future refactor that swaps the
      // reason shouldn't silently change a 400 into something else
      await expect(result).rejects.toMatchObject({ code: "BAD_REQUEST" })
    })

    it("should throw 404 if the redirect is already deleted", async () => {
      // Arrange
      const inserted = await db
        .insertInto("Redirect")
        .values({
          siteId,
          source: "/gone",
          destination: "/dest",
          deletedAt: new Date(),
        })
        .returning("id")
        .executeTakeFirstOrThrow()

      // Act
      const result = caller.delete({ siteId, id: inserted.id })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "NOT_FOUND", message: "Redirect not found" }),
      )
    })

    it("should not delete redirects belonging to other sites", async () => {
      // Arrange
      const { site: otherSite } = await setupSite()
      const inserted = await db
        .insertInto("Redirect")
        .values({
          siteId: otherSite.id,
          source: "/safe",
          destination: "/dest",
        })
        .returning("id")
        .executeTakeFirstOrThrow()

      // Act
      const result = caller.delete({ siteId, id: inserted.id })

      // Assert
      await expect(result).rejects.toThrowError(
        new TRPCError({ code: "NOT_FOUND", message: "Redirect not found" }),
      )
      const row = await db
        .selectFrom("Redirect")
        .select("deletedAt")
        .where("id", "=", inserted.id)
        .executeTakeFirstOrThrow()
      expect(row.deletedAt).toBeNull()
    })

    it("should soft-delete the redirect even if the site publish fails", async () => {
      // Arrange: publish runs after the delete transaction commits.
      const inserted = await db
        .insertInto("Redirect")
        .values({ siteId, source: "/remove-me", destination: "/dest" })
        .returning("id")
        .executeTakeFirstOrThrow()
      const publishSpy = vi
        .spyOn(codebuildService, "publishSite")
        .mockRejectedValueOnce(new Error("CodeBuild unavailable"))

      // Act
      const result = caller.delete({ siteId, id: inserted.id })

      // Assert
      await expect(result).rejects.toThrowError("CodeBuild unavailable")
      expect(publishSpy).toHaveBeenCalledOnce()
      const row = await db
        .selectFrom("Redirect")
        .select("deletedAt")
        .where("id", "=", inserted.id)
        .executeTakeFirstOrThrow()
      expect(row.deletedAt).not.toBeNull()
    })

    it("should write a RedirectDelete audit log entry with the live and soft-deleted rows", async () => {
      // Arrange
      const inserted = await db
        .insertInto("Redirect")
        .values({ siteId, source: "/bye", destination: "/x" })
        .returning("id")
        .executeTakeFirstOrThrow()

      // Act
      await caller.delete({ siteId, id: inserted.id })

      // Assert
      const auditEntry = await db
        .selectFrom("AuditLog")
        .selectAll()
        .where("siteId", "=", siteId)
        .where("eventType", "=", "RedirectDelete")
        .executeTakeFirstOrThrow()
      expect(auditEntry.userId).toBe(session.userId)
      const delta = auditEntry.delta as {
        before: { source: string; deletedAt: string | null }
        after: { source: string; deletedAt: string | null }
      }
      expect(delta.before).toMatchObject({ source: "/bye", deletedAt: null })
      expect(delta.after.source).toBe("/bye")
      expect(delta.after.deletedAt).not.toBeNull()
      // The site publish triggered by the delete is audited separately
      const publishEntry = await db
        .selectFrom("AuditLog")
        .selectAll()
        .where("siteId", "=", siteId)
        .where("eventType", "=", "Publish")
        .executeTakeFirstOrThrow()
      expect(publishEntry.userId).toBe(session.userId)
    })
  })

  describe("getBySource", () => {
    it("should throw 403 if user does not have read access to the site", async () => {
      // Arrange
      const { site: otherSite } = await setupSite()

      // Act
      const result = caller.getBySource({
        siteId: otherSite.id,
        source: "/old",
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

    it("should return null when no live redirect has that source", async () => {
      // Arrange / Act
      const result = await caller.getBySource({
        siteId,
        source: "/no-redirect",
      })

      // Assert
      expect(result).toBeNull()
    })

    it("should return an external destination verbatim", async () => {
      // Arrange
      await db
        .insertInto("Redirect")
        .values({
          siteId,
          source: "/old",
          destination: "https://www.example.gov.sg",
        })
        .execute()

      // Act
      const result = await caller.getBySource({ siteId, source: "/old" })

      // Assert
      expect(result).toEqual({
        destination: "https://www.example.gov.sg",
        destinationResourceId: null,
      })
    })

    it("should resolve a reference destination to the page's current permalink", async () => {
      // Arrange
      const { page } = await setupPageResource({
        siteId,
        resourceType: ResourceType.Page,
        permalink: "target-page",
        state: ResourceState.Published,
        userId,
      })
      await db
        .insertInto("Redirect")
        .values({
          siteId,
          source: "/old",
          destination: `[resource:${siteId}:${page.id}]`,
        })
        .execute()

      // Act
      const result = await caller.getBySource({ siteId, source: "/old" })

      // Assert — destinationResourceId lets the caller detect a redirect that
      // points back at the page being edited
      expect(result).toEqual({
        destination: "/target-page",
        destinationResourceId: Number(page.id),
      })
    })

    it("should match regardless of leading/trailing slashes in the queried path", async () => {
      // Arrange
      await db
        .insertInto("Redirect")
        .values({
          siteId,
          source: "/old",
          destination: "https://www.example.gov.sg",
        })
        .execute()

      // Act — the page settings field may pass an un-normalised path
      const result = await caller.getBySource({ siteId, source: "old/" })

      // Assert
      expect(result).toEqual({
        destination: "https://www.example.gov.sg",
        destinationResourceId: null,
      })
    })

    it("should not match a soft-deleted redirect", async () => {
      // Arrange
      await db
        .insertInto("Redirect")
        .values({
          siteId,
          source: "/old",
          destination: "https://www.example.gov.sg",
          deletedAt: new Date(),
        })
        .execute()

      // Act
      const result = await caller.getBySource({ siteId, source: "/old" })

      // Assert
      expect(result).toBeNull()
    })
  })

  describe("countByDestinationResource", () => {
    it("should throw 403 if user does not have read access to the site", async () => {
      // Arrange
      const { site: otherSite } = await setupSite()

      // Act
      const result = caller.countByDestinationResource({
        siteId: otherSite.id,
        resourceId: "1",
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

    it("should count live redirects pointing to the resource", async () => {
      // Arrange
      const { page } = await setupPageResource({
        siteId,
        resourceType: ResourceType.Page,
        permalink: "target",
        state: ResourceState.Published,
        userId,
      })
      await db
        .insertInto("Redirect")
        .values([
          {
            siteId,
            source: "/a",
            destination: `[resource:${siteId}:${page.id}]`,
          },
          {
            siteId,
            source: "/b",
            destination: `[resource:${siteId}:${page.id}]`,
          },
        ])
        .execute()

      // Act
      const count = await caller.countByDestinationResource({
        siteId,
        resourceId: String(page.id),
      })

      // Assert
      expect(count).toBe(2)
    })

    it("should count redirects pointing to a descendant page of a folder", async () => {
      // Arrange — a redirect to a page nested inside the folder being counted
      const { folder } = await setupFolder({ siteId, permalink: "folder" })
      const { page } = await setupPageResource({
        siteId,
        resourceType: ResourceType.Page,
        parentId: folder.id,
        permalink: "leaf",
        state: ResourceState.Published,
        userId,
      })
      await db
        .insertInto("Redirect")
        .values({
          siteId,
          source: "/a",
          destination: `[resource:${siteId}:${page.id}]`,
        })
        .execute()

      // Act
      const count = await caller.countByDestinationResource({
        siteId,
        resourceId: String(folder.id),
      })

      // Assert
      expect(count).toBe(1)
    })

    it("should not count a literal-path destination (reference-only)", async () => {
      // Arrange — a literal-path destination that happens to match the page's
      // path is not a reference, so it is intentionally not counted
      const { page } = await setupPageResource({
        siteId,
        resourceType: ResourceType.Page,
        permalink: "target",
        state: ResourceState.Published,
        userId,
      })
      await db
        .insertInto("Redirect")
        .values({ siteId, source: "/a", destination: "/target" })
        .execute()

      // Act
      const count = await caller.countByDestinationResource({
        siteId,
        resourceId: String(page.id),
      })

      // Assert
      expect(count).toBe(0)
    })

    it("should not count soft-deleted redirects", async () => {
      // Arrange
      const { page } = await setupPageResource({
        siteId,
        resourceType: ResourceType.Page,
        permalink: "target",
        state: ResourceState.Published,
        userId,
      })
      await db
        .insertInto("Redirect")
        .values({
          siteId,
          source: "/a",
          destination: `[resource:${siteId}:${page.id}]`,
          deletedAt: new Date(),
        })
        .execute()

      // Act
      const count = await caller.countByDestinationResource({
        siteId,
        resourceId: String(page.id),
      })

      // Assert
      expect(count).toBe(0)
    })

    it("should return 0 for a resource that does not exist (empty references)", async () => {
      // Arrange — no resource resolves, so the descendant reference list is
      // empty; the count must short-circuit rather than emit an empty `in ()`.
      // Act
      const count = await caller.countByDestinationResource({
        siteId,
        resourceId: "999999",
      })

      // Assert
      expect(count).toBe(0)
    })
  })

  describe("create — wildcard and query sources", () => {
    it("stores a wildcard whose internal destination becomes a page reference", async () => {
      // Arrange
      const { page } = await setupPageResource({
        siteId,
        resourceType: ResourceType.Page,
        permalink: "new-section",
        state: ResourceState.Published,
        userId: session.userId,
      })

      // Act
      await caller.create({
        siteId,
        source: "/old-section/*",
        destination: "/new-section",
      })

      // Assert — the destination resolves to a [resource:…] reference so it
      // follows the page if its permalink changes; the "/*" stays in the source.
      const row = await db
        .selectFrom("Redirect")
        .select(["source", "destination"])
        .where("siteId", "=", siteId)
        .where("source", "=", "/old-section/*")
        .executeTakeFirstOrThrow()
      expect(row.source).toBe("/old-section/*")
      expect(row.destination).toBe(`[resource:${siteId}:${page.id}]`)
    })

    it("stores a query redirect with an external destination verbatim", async () => {
      // Arrange / Act
      await caller.create({
        siteId,
        source: "/gallery.html?artwork=401",
        destination: "https://x.gov.sg/g",
      })

      // Assert
      const row = await db
        .selectFrom("Redirect")
        .select(["source", "destination"])
        .where("siteId", "=", siteId)
        .where("source", "=", "/gallery.html?artwork=401")
        .executeTakeFirstOrThrow()
      expect(row.source).toBe("/gallery.html?artwork=401")
      expect(row.destination).toBe("https://x.gov.sg/g")
    })

    it("does not block a wildcard source as if it shadowed a published page", async () => {
      // Arrange — there is no published page at "/anything/*" (the literal path
      // with "/*" can never match any real resource), so the create must succeed.
      await expect(
        caller.create({
          siteId,
          source: "/anything/*",
          destination: "/home",
        }),
      ).resolves.toBeDefined()
    })

    it("stores a query redirect whose internal destination becomes a page reference", async () => {
      // Arrange
      const { page } = await setupPageResource({
        siteId,
        resourceType: ResourceType.Page,
        permalink: "target",
        state: ResourceState.Published,
        userId: session.userId,
      })

      // Act
      await caller.create({
        siteId,
        source: "/gallery.html?view=list",
        destination: "/target",
      })

      // Assert
      const row = await db
        .selectFrom("Redirect")
        .select("destination")
        .where("siteId", "=", siteId)
        .where("source", "=", "/gallery.html?view=list")
        .executeTakeFirstOrThrow()
      expect(row.destination).toBe(`[resource:${siteId}:${page.id}]`)
    })
  })
})
