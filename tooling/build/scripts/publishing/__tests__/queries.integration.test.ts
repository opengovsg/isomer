import pg from "pg"
import { afterAll, beforeAll, describe, expect, it } from "vitest"

import { sql } from "@isomer/db"

import {
  GET_ALL_RESOURCES_WITH_FULL_PERMALINKS,
  GET_CONFIG,
  GET_FOOTER,
  GET_NAVBAR,
  GET_REDIRECTS,
} from "../queries"
import { buildFixtureSite } from "./fixtures/buildFixtureSite"
import { setupTestDb, type TestDb } from "./helpers/db"

// These tests run the FIVE production queries through a raw `pg` client, exactly
// as the publishing script does today (PR 5b is still the raw-`pg` era — no
// Kysely execution of the queries-under-test). The fixture *builder* uses Kysely
// via `@isomer/db`, but the queries below are executed verbatim against `pg`.
const SITE_ID = 1

// Shape of a row returned by GET_ALL_RESOURCES_WITH_FULL_PERMALINKS. Raw `pg`
// returns untyped rows, so we describe just the fields these tests assert on.
interface ResourceRow {
  id: string
  type: string
  title: string
  fullPermalink: string
  parentId: string | null
  publishedVersionId: string | null
  content: unknown
}

describe("publishing queries (raw pg, against fixture site)", () => {
  let testDb: TestDb
  let client: pg.Client

  beforeAll(async () => {
    testDb = await setupTestDb()
    await buildFixtureSite(testDb.db, SITE_ID)
    // The script connects via raw pg; mirror that here.
    client = new pg.Client({ connectionString: testDb.connectionString })
    await client.connect()
  })

  afterAll(async () => {
    await client.end()
    await testDb.destroy()
  })

  describe("GET_ALL_RESOURCES_WITH_FULL_PERMALINKS", () => {
    it("returns every resource for the site with a recursively-built fullPermalink", async () => {
      const { rows } = await client.query(
        GET_ALL_RESOURCES_WITH_FULL_PERMALINKS,
        [SITE_ID],
      )

      const byPermalink = new Map<string, ResourceRow>(
        (rows as ResourceRow[]).map((r) => [r.fullPermalink, r]),
      )

      // Multi-level tree: root → parent-folder → nested page, with recursive
      // permalink concatenation.
      expect(byPermalink.has("")).toBe(true) // root page (empty permalink)
      expect(byPermalink.has("parent-folder")).toBe(true)
      expect(byPermalink.has("parent-folder/about")).toBe(true)
      expect(byPermalink.has("parent-folder/contact")).toBe(true)
      expect(byPermalink.has("parent-folder/_index")).toBe(true)
      expect(byPermalink.has("parent-folder/dangling-folder")).toBe(true)
      expect(byPermalink.has("parent-folder/dangling-folder/buried")).toBe(true)
      expect(byPermalink.has("news/article-one")).toBe(true)
      expect(byPermalink.has("news/_meta")).toBe(true)
    })

    it("populates content for published pages, null for folders and unpublished resources", async () => {
      const { rows } = await client.query(
        GET_ALL_RESOURCES_WITH_FULL_PERMALINKS,
        [SITE_ID],
      )
      const byPermalink = new Map<string, ResourceRow>(
        (rows as ResourceRow[]).map((r) => [r.fullPermalink, r]),
      )

      // Published Page → Blob content present
      const about = byPermalink.get("parent-folder/about")
      expect(about?.content).not.toBeNull()
      expect(about?.content).toMatchObject({ layout: "content" })

      // Folder → content NULL (folder type not in the content CASE list)
      const folder = byPermalink.get("parent-folder")
      expect(folder?.content).toBeNull()

      // Unpublished Page → publishedVersionId null → Blob join yields NULL content
      const draft = byPermalink.get("draft-page")
      expect(draft?.publishedVersionId).toBeNull()
      expect(draft?.content).toBeNull()
    })

    it("only returns resources for the requested site", async () => {
      // A non-existent site returns no rows.
      const { rows: none } = await client.query(
        GET_ALL_RESOURCES_WITH_FULL_PERMALINKS,
        [999],
      )
      expect(none).toHaveLength(0)
    })
  })

  describe("GET_NAVBAR", () => {
    it("returns the navbar content for the site", async () => {
      const { rows } = await client.query(GET_NAVBAR, [SITE_ID])
      expect(rows).toHaveLength(1)
      expect(rows[0].content).toMatchObject({
        items: [{ url: "/parent-folder", name: "Parent Folder" }],
      })
    })
  })

  describe("GET_FOOTER", () => {
    it("returns the footer content for the site", async () => {
      const { rows } = await client.query(GET_FOOTER, [SITE_ID])
      expect(rows).toHaveLength(1)
      expect(rows[0].content).toMatchObject({ contactUsLink: "/contact-us" })
    })
  })

  describe("GET_CONFIG", () => {
    it("returns name, config, and theme for the site", async () => {
      const { rows } = await client.query(GET_CONFIG, [SITE_ID])
      expect(rows).toHaveLength(1)
      expect(rows[0].name).toBe("Fixture Ministry")
      expect(rows[0].config).toMatchObject({ theme: "isomer-next" })
      expect(rows[0].theme).not.toBeNull()
    })
  })

  describe("GET_REDIRECTS", () => {
    it("returns only non-soft-deleted redirects (deletedAt IS NULL)", async () => {
      const { rows } = await client.query(GET_REDIRECTS, [SITE_ID])
      expect(rows).toEqual([{ source: "/old-home", destination: "/" }])
    })
  })
})

describe("edge fixtures", () => {
  it("GET_ALL... returns an empty array for an empty site", async () => {
    const testDb = await setupTestDb()
    try {
      // Empty site: a Site row with no resources.
      await testDb.db
        .insertInto("Site")
        .values({
          // @ts-expect-error id is GeneratedAlways but we override it for fixtures
          id: 2,
          name: "Empty Site",
          config: testDbConfig(),
          theme: null,
          codeBuildId: null,
        })
        .execute()

      const client = new pg.Client({
        connectionString: testDb.connectionString,
      })
      await client.connect()
      try {
        const { rows } = await client.query(
          GET_ALL_RESOURCES_WITH_FULL_PERMALINKS,
          [2],
        )
        expect(rows).toHaveLength(0)
      } finally {
        await client.end()
      }
    } finally {
      await testDb.destroy()
    }
  })

  it("GET_REDIRECTS returns empty when the only redirect is soft-deleted", async () => {
    const testDb = await setupTestDb()
    try {
      await testDb.db
        .insertInto("Site")
        .values({
          // @ts-expect-error id is GeneratedAlways but we override it for fixtures
          id: 3,
          name: "Redirect Edge Site",
          config: testDbConfig(),
          theme: null,
          codeBuildId: null,
        })
        .execute()
      await testDb.db
        .insertInto("Redirect")
        .values({
          siteId: 3,
          source: "/only-deleted",
          destination: "/gone",
          deletedAt: new Date("2026-01-01T00:00:00.000Z"),
        })
        .execute()

      const client = new pg.Client({
        connectionString: testDb.connectionString,
      })
      await client.connect()
      try {
        const { rows } = await client.query(GET_REDIRECTS, [3])
        expect(rows).toHaveLength(0)
      } finally {
        await client.end()
      }
    } finally {
      await testDb.destroy()
    }
  })
})

// Local minimal config JSONB literal for the edge fixtures.
const testDbConfig = () =>
  sql`CAST(${JSON.stringify({
    theme: "isomer-next",
    logoUrl: "",
    siteName: "Edge",
    isGovernment: true,
    url: "",
  })} AS JSONB)`
