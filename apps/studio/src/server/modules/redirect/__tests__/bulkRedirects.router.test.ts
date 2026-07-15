import { auth } from "tests/integration/helpers/auth"
import { resetTables } from "tests/integration/helpers/db"
import {
  applyAuthedSession,
  createMockRequest,
} from "tests/integration/helpers/iron-session"
import {
  setupAdminPermissions,
  setupPageResource,
  setupSite,
  setupUser,
} from "tests/integration/helpers/seed"
import { BULK_REDIRECT_CSV_HEADERS } from "~/lib/redirectCsv"
import { createCallerFactory } from "~/server/trpc"
import { ResourceState, ResourceType } from "~prisma/generated/generatedEnums"

import * as codebuildService from "../../aws/codebuild.service"
import { db } from "../../database"
import { redirectRouter } from "../redirect.router"

const createCaller = createCallerFactory(redirectRouter)

// Builds a CSV body with the template's friendly header and the given rows.
const csvOf = (rows: [source: string, destination: string][]) =>
  [
    `${BULK_REDIRECT_CSV_HEADERS.source},${BULK_REDIRECT_CSV_HEADERS.destination}`,
    ...rows.map(([source, destination]) => `${source},${destination}`),
  ].join("\n")

describe("redirect.router bulk upload", async () => {
  let caller: ReturnType<typeof createCaller>
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
    // Publishing goes through CodeBuild; stub it so tests never hit AWS and can
    // assert how often a batch republishes.
    vi.spyOn(codebuildService, "publishSite").mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const seedPublishedPageAtRoot = async (permalink: string) => {
    await setupPageResource({
      siteId,
      resourceType: ResourceType.RootPage,
      parentId: null,
    })
    await setupPageResource({
      siteId,
      resourceType: ResourceType.Page,
      parentId: null,
      permalink,
      state: ResourceState.Published,
      userId,
    })
  }

  const errorFor = (
    result: { rows: { source: string; error: string | null }[] },
    source: string,
  ) => result.rows.find((row) => row.source === source)?.error ?? null

  describe("bulkValidate", () => {
    it("throws 403 without read access to the site", async () => {
      // Arrange
      const { site: otherSite } = await setupSite()

      // Act
      const result = caller.bulkValidate({
        siteId: otherSite.id,
        csv: csvOf([["/a", "/b"]]),
      })

      // Assert
      await expect(result).rejects.toMatchObject({ code: "FORBIDDEN" })
    })

    it("returns a file-level error for a missing column", async () => {
      // Arrange / Act
      const result = await caller.bulkValidate({
        siteId,
        csv: "When someone visits\n/a",
      })

      // Assert
      expect(result.fileError).not.toBeNull()
      expect(result.rows).toEqual([])
    })

    it("flags a malformed row with the shared schema message", async () => {
      // Arrange: a source containing a scheme is rejected by the source rules.
      const result = await caller.bulkValidate({
        siteId,
        csv: csvOf([["https://evil.com", "/b"]]),
      })

      // Assert
      expect(result.errorCount).toBe(1)
      expect(errorFor(result, "https://evil.com")).toBeTruthy()
    })

    it("flags a source listed more than once in the file", async () => {
      // Arrange / Act
      const result = await caller.bulkValidate({
        siteId,
        csv: csvOf([
          ["/dup", "/one"],
          ["/dup", "/two"],
        ]),
      })

      // Assert: both rows carry the duplicate error.
      expect(result.errorCount).toBe(2)
      expect(errorFor(result, "/dup")).toContain("more than once")
    })

    it("flags a source already redirected on the table", async () => {
      // Arrange
      await db
        .insertInto("Redirect")
        .values({ siteId, source: "/taken", destination: "/elsewhere" })
        .execute()

      // Act
      const result = await caller.bulkValidate({
        siteId,
        csv: csvOf([["/taken", "/new"]]),
      })

      // Assert
      expect(errorFor(result, "/taken")).toBeTruthy()
    })

    it("flags a source that shadows a live published page", async () => {
      // Arrange
      await seedPublishedPageAtRoot("shadowed")

      // Act
      const result = await caller.bulkValidate({
        siteId,
        csv: csvOf([["/shadowed", "/somewhere"]]),
      })

      // Assert
      expect(errorFor(result, "/shadowed")).toBeTruthy()
    })

    it("flags a loop formed within the uploaded file", async () => {
      // Arrange / Act: /a -> /b and /b -> /a in the same upload.
      const result = await caller.bulkValidate({
        siteId,
        csv: csvOf([
          ["/a", "/b"],
          ["/b", "/a"],
        ]),
      })

      // Assert: both rows are flagged as loops.
      expect(result.errorCount).toBe(2)
      expect(errorFor(result, "/a")).toBeTruthy()
      expect(errorFor(result, "/b")).toBeTruthy()
    })

    it("flags a loop formed against an existing table redirect", async () => {
      // Arrange: table already has /b -> /a; uploading /a -> /b closes the loop.
      await db
        .insertInto("Redirect")
        .values({ siteId, source: "/b", destination: "/a" })
        .execute()

      // Act
      const result = await caller.bulkValidate({
        siteId,
        csv: csvOf([["/a", "/b"]]),
      })

      // Assert
      expect(errorFor(result, "/a")).toBeTruthy()
    })

    it("flags a batch loop longer than 10 hops (any-length cycle)", async () => {
      // Arrange: a 12-node cycle /n0 -> /n1 -> ... -> /n11 -> /n0, longer than
      // the former fixed hop cap, so every node must still be flagged.
      const size = 12
      const rows = Array.from({ length: size }, (_, i): [string, string] => [
        `/n${i}`,
        `/n${(i + 1) % size}`,
      ])

      // Act
      const result = await caller.bulkValidate({ siteId, csv: csvOf(rows) })

      // Assert: the whole cycle is rejected, not silently published.
      expect(result.errorCount).toBe(size)
      expect(errorFor(result, "/n0")).toBeTruthy()
      expect(errorFor(result, "/n11")).toBeTruthy()
    })

    it("flags a row split by an unquoted comma in the destination", async () => {
      // Arrange: an unquoted comma splits the destination into a stray column,
      // which would otherwise silently truncate it and publish a wrong redirect.
      const csv = `${BULK_REDIRECT_CSV_HEADERS.source},${BULK_REDIRECT_CSV_HEADERS.destination}\n/old,https://example.gov.sg/a,b`

      // Act
      const result = await caller.bulkValidate({ siteId, csv })

      // Assert
      expect(errorFor(result, "/old")).toContain("extra columns")
    })

    it("returns a clean result for a fully valid file", async () => {
      // Arrange / Act
      const result = await caller.bulkValidate({
        siteId,
        csv: csvOf([
          ["/old-one", "/new-one"],
          ["/old-two", "https://example.gov.sg"],
        ]),
      })

      // Assert
      expect(result.fileError).toBeNull()
      expect(result.errorCount).toBe(0)
      expect(result.validCount).toBe(2)
    })
  })

  describe("bulkCreate", () => {
    it("throws 403 without create access to the site", async () => {
      // Arrange: a viewer-less other site the admin can't create on.
      const { site: otherSite } = await setupSite()

      // Act
      const result = caller.bulkCreate({
        siteId: otherSite.id,
        csv: csvOf([["/a", "/b"]]),
      })

      // Assert
      await expect(result).rejects.toMatchObject({ code: "FORBIDDEN" })
    })

    it("does not publish and returns the validation when a row has an error", async () => {
      // Arrange
      const publishSpy = vi.spyOn(codebuildService, "publishSite")

      // Act
      const result = await caller.bulkCreate({
        siteId,
        csv: csvOf([["https://bad-source", "/b"]]),
      })

      // Assert
      expect(result.ok).toBe(false)
      if (!result.ok) {
        expect(result.validation.errorCount).toBe(1)
      }
      expect(publishSpy).not.toHaveBeenCalled()
    })

    it("inserts every row and publishes exactly once on success", async () => {
      // Arrange
      const publishSpy = vi.spyOn(codebuildService, "publishSite")

      // Act
      const result = await caller.bulkCreate({
        siteId,
        csv: csvOf([
          ["/old-one", "/new-one"],
          ["/old-two", "https://example.gov.sg"],
        ]),
      })

      // Assert
      expect(result).toEqual({ ok: true, publishedCount: 2 })
      expect(publishSpy).toHaveBeenCalledTimes(1)
      const live = await db
        .selectFrom("Redirect")
        .select(["source", "destination"])
        .where("siteId", "=", siteId)
        .where("deletedAt", "is", null)
        .orderBy("source")
        .execute()
      expect(live).toEqual([
        { source: "/old-one", destination: "/new-one" },
        { source: "/old-two", destination: "https://example.gov.sg" },
      ])
    })

    it("revives a soft-deleted redirect for a source in the batch", async () => {
      // Arrange: a previously-deleted redirect for /old-one.
      await db
        .insertInto("Redirect")
        .values({
          siteId,
          source: "/old-one",
          destination: "/stale",
          deletedAt: new Date(),
        })
        .execute()

      // Act
      const result = await caller.bulkCreate({
        siteId,
        csv: csvOf([["/old-one", "/fresh"]]),
      })

      // Assert
      expect(result).toEqual({ ok: true, publishedCount: 1 })
      const revived = await db
        .selectFrom("Redirect")
        .selectAll()
        .where("siteId", "=", siteId)
        .where("source", "=", "/old-one")
        .executeTakeFirstOrThrow()
      expect(revived.deletedAt).toBeNull()
      expect(revived.destination).toBe("/fresh")
    })

    it("logs one RedirectCreate per row plus one Publish event", async () => {
      // Arrange / Act
      await caller.bulkCreate({
        siteId,
        csv: csvOf([
          ["/old-one", "/new-one"],
          ["/old-two", "/new-two"],
        ]),
      })

      // Assert
      const events = await db
        .selectFrom("AuditLog")
        .select("eventType")
        .where("siteId", "=", siteId)
        .execute()
      const created = events.filter((e) => e.eventType === "RedirectCreate")
      const published = events.filter((e) => e.eventType === "Publish")
      expect(created).toHaveLength(2)
      expect(published).toHaveLength(1)
    })
  })
})
