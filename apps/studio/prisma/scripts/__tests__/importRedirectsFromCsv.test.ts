import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import {
  db,
  jsonb,
  ResourceState,
  ResourceType,
} from "~/server/modules/database"

import { resetTables } from "../../../tests/integration/helpers/db"
import {
  setupFolder,
  setupPageResource,
  setupSite,
  setupUser,
} from "../../../tests/integration/helpers/seed"
import { importRedirectsFromCsv } from "../importRedirectsFromCsv"

let tmpDir: string
let csvCounter = 0

beforeAll(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "import-redirects-test-"))
})

afterAll(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true })
})

const writeCsv = (
  rows: string[],
  { header = "domainName,source,target" }: { header?: string } = {},
) => {
  csvCounter += 1
  const csvPath = path.join(tmpDir, `redirects-${csvCounter}.csv`)
  fs.writeFileSync(csvPath, [header, ...rows].join("\n"))
  return csvPath
}

// setupSite seeds config.url as "" - point it at a domain so the import
// script's domain matching can find the site
const setupSiteWithUrl = async (url: string) => {
  const { site } = await setupSite()
  await db
    .updateTable("Site")
    .set({ config: jsonb({ ...site.config, url }) })
    .where("id", "=", site.id)
    .execute()
  return site.id
}

const getRedirects = (siteId: number) =>
  db
    .selectFrom("Redirect")
    .select(["source", "destination", "deletedAt"])
    .where("siteId", "=", siteId)
    .orderBy("source")
    .execute()

describe("importRedirectsFromCsv", () => {
  beforeEach(async () => {
    await resetTables(
      "Redirect",
      "Blob",
      "Version",
      "Resource",
      "Navbar",
      "Footer",
      "Site",
      "User",
    )
  })

  it("imports rows for the site whose config.url matches the CSV domain", async () => {
    // Arrange
    const siteId = await setupSiteWithUrl("www.alpha.gov.sg")
    const csvPath = writeCsv([
      "www.alpha.gov.sg,/old-page,/new-page",
      "www.alpha.gov.sg,/external,https://example.gov.sg/page",
    ])

    // Act
    const summary = await importRedirectsFromCsv({ csvPath, dryRun: false })

    // Assert
    const redirects = await getRedirects(siteId)
    expect(redirects).toEqual([
      {
        source: "/external",
        destination: "https://example.gov.sg/page",
        deletedAt: null,
      },
      { source: "/old-page", destination: "/new-page", deletedAt: null },
    ])
    expect(summary.sitesMatched).toBe(1)
    expect(summary.importedCount).toBe(2)
  })

  it("converts an internal destination to a page reference when a live page exists at that path", async () => {
    // Arrange
    const siteId = await setupSiteWithUrl("www.alpha.gov.sg")
    const user = await setupUser({ email: "import-page@open.gov.sg" })
    const { page } = await setupPageResource({
      siteId,
      resourceType: ResourceType.Page,
      permalink: "new-page",
      parentId: null,
      state: ResourceState.Published,
      userId: user.id,
    })
    const csvPath = writeCsv(["www.alpha.gov.sg,/old-page,/new-page"])

    // Act
    const summary = await importRedirectsFromCsv({ csvPath, dryRun: false })

    // Assert — the permalink is stored as a [resource:...] reference so the
    // redirect follows the page if its permalink later changes
    const redirects = await getRedirects(siteId)
    expect(redirects).toEqual([
      {
        source: "/old-page",
        destination: `[resource:${siteId}:${page.id}]`,
        deletedAt: null,
      },
    ])
    expect(summary.referenceCount).toBe(1)
  })

  it("converts a folder destination to the folder's reference when its index page is published", async () => {
    // Arrange — a folder is served by its published index page; the reference
    // must point at the folder (its index page id never appears in the build)
    const siteId = await setupSiteWithUrl("www.alpha.gov.sg")
    const user = await setupUser({ email: "import-folder@open.gov.sg" })
    const { folder } = await setupFolder({ siteId, permalink: "info" })
    await setupPageResource({
      siteId,
      resourceType: ResourceType.IndexPage,
      permalink: "_index",
      parentId: folder.id,
      state: ResourceState.Published,
      userId: user.id,
    })
    const csvPath = writeCsv(["www.alpha.gov.sg,/old,/info"])

    // Act
    await importRedirectsFromCsv({ csvPath, dryRun: false })

    // Assert
    const redirects = await getRedirects(siteId)
    expect(redirects).toEqual([
      {
        source: "/old",
        destination: `[resource:${siteId}:${folder.id}]`,
        deletedAt: null,
      },
    ])
  })

  it("keeps an internal destination as a literal path when no live page exists at it", async () => {
    // Arrange
    const siteId = await setupSiteWithUrl("www.alpha.gov.sg")
    const csvPath = writeCsv(["www.alpha.gov.sg,/old-page,/missing-page"])

    // Act
    const summary = await importRedirectsFromCsv({ csvPath, dryRun: false })

    // Assert — an unresolved internal path stays literal and is surfaced for review
    const redirects = await getRedirects(siteId)
    expect(redirects).toEqual([
      { source: "/old-page", destination: "/missing-page", deletedAt: null },
    ])
    expect(summary.referenceCount).toBe(0)
    expect(summary.unresolvedDestinations).toHaveLength(1)
  })

  it("skips rows for domains with no matching site and reports them", async () => {
    // Arrange
    const siteId = await setupSiteWithUrl("www.alpha.gov.sg")
    const csvPath = writeCsv([
      "www.alpha.gov.sg,/old-page,/new-page",
      "www.unknown.gov.sg,/a,/b",
      "www.unknown.gov.sg,/c,/d",
    ])

    // Act
    const summary = await importRedirectsFromCsv({ csvPath, dryRun: false })

    // Assert
    const redirects = await getRedirects(siteId)
    expect(redirects).toHaveLength(1)
    expect(summary.unmatchedDomains.get("www.unknown.gov.sg")).toBe(2)
  })

  it("parses quoted fields containing commas per standard CSV quoting", async () => {
    // Arrange
    const siteId = await setupSiteWithUrl("www.alpha.gov.sg")
    const csvPath = writeCsv([
      'www.alpha.gov.sg,/old-page,"https://example.gov.sg/a,b"',
    ])

    // Act
    await importRedirectsFromCsv({ csvPath, dryRun: false })

    // Assert
    const redirects = await getRedirects(siteId)
    expect(redirects).toEqual([
      {
        source: "/old-page",
        destination: "https://example.gov.sg/a,b",
        deletedAt: null,
      },
    ])
  })

  it("tolerates a UTF-8 BOM and whitespace around fields", async () => {
    // Arrange
    const siteId = await setupSiteWithUrl("www.alpha.gov.sg")
    const csvPath = writeCsv(["www.alpha.gov.sg, /old-page , /new-page "], {
      header: "\uFEFFdomainName,source,target",
    })

    // Act
    await importRedirectsFromCsv({ csvPath, dryRun: false })

    // Assert
    const redirects = await getRedirects(siteId)
    expect(redirects).toEqual([
      { source: "/old-page", destination: "/new-page", deletedAt: null },
    ])
  })

  it("matches domains ignoring case, scheme and trailing path", async () => {
    // Arrange
    const siteId = await setupSiteWithUrl("https://WWW.Alpha.gov.sg/")
    const csvPath = writeCsv(["www.alpha.gov.sg,/old-page,/new-page"])

    // Act
    await importRedirectsFromCsv({ csvPath, dryRun: false })

    // Assert
    const redirects = await getRedirects(siteId)
    expect(redirects).toHaveLength(1)
  })

  it("ignores rows with wildcards in source or target", async () => {
    // Arrange
    const siteId = await setupSiteWithUrl("www.alpha.gov.sg")
    const csvPath = writeCsv([
      "www.alpha.gov.sg,/old-section/*,/new-section",
      "www.alpha.gov.sg,/old-page,/new-section/*",
      "www.alpha.gov.sg,/kept,/destination",
    ])

    // Act
    const summary = await importRedirectsFromCsv({ csvPath, dryRun: false })

    // Assert
    const redirects = await getRedirects(siteId)
    expect(redirects.map((row) => row.source)).toEqual(["/kept"])
    expect(summary.wildcardRowCount).toBe(2)
  })

  it("ignores rows with query parameters in source or target", async () => {
    // Arrange
    const siteId = await setupSiteWithUrl("www.alpha.gov.sg")
    const csvPath = writeCsv([
      "www.alpha.gov.sg,/old-page?lang=en,/new-page",
      "www.alpha.gov.sg,/news,/articles/?page=1",
      "www.alpha.gov.sg,/kept,/destination",
    ])

    // Act
    const summary = await importRedirectsFromCsv({ csvPath, dryRun: false })

    // Assert
    const redirects = await getRedirects(siteId)
    expect(redirects.map((row) => row.source)).toEqual(["/kept"])
    expect(summary.queryParamRowCount).toBe(2)
  })

  it("skips rows that fail redirect validation and reports the reason", async () => {
    // Arrange
    const siteId = await setupSiteWithUrl("www.alpha.gov.sg")
    const csvPath = writeCsv([
      "www.alpha.gov.sg,/empty-destination,",
      "www.alpha.gov.sg,/insecure,http://example.com",
      "www.alpha.gov.sg,/mail,mailto:hello@example.gov.sg",
      "www.alpha.gov.sg,/kept,/destination",
    ])

    // Act
    const summary = await importRedirectsFromCsv({ csvPath, dryRun: false })

    // Assert
    const redirects = await getRedirects(siteId)
    expect(redirects.map((row) => row.source)).toEqual(["/kept"])
    expect(summary.invalidRows).toHaveLength(3)
    expect(summary.invalidRows[0]?.reason).toContain(
      "Destination must start with '/' or 'https://'",
    )
  })

  it("normalises sources the same way as the publish flow", async () => {
    // Arrange
    const siteId = await setupSiteWithUrl("www.alpha.gov.sg")
    const csvPath = writeCsv(["www.alpha.gov.sg,//old//page/,/new-page"])

    // Act
    await importRedirectsFromCsv({ csvPath, dryRun: false })

    // Assert
    const redirects = await getRedirects(siteId)
    expect(redirects.map((row) => row.source)).toEqual(["/old/page"])
  })

  it("keeps the first destination when two sources normalise to the same value", async () => {
    // Arrange
    const siteId = await setupSiteWithUrl("www.alpha.gov.sg")
    const csvPath = writeCsv([
      "www.alpha.gov.sg,/old-page,/first",
      "www.alpha.gov.sg,/old-page/,/second",
    ])

    // Act
    const summary = await importRedirectsFromCsv({ csvPath, dryRun: false })

    // Assert
    const redirects = await getRedirects(siteId)
    expect(redirects).toHaveLength(1)
    expect(redirects[0]?.destination).toBe("/first")
    expect(summary.duplicateRows).toHaveLength(1)
  })

  it("is idempotent: re-running updates destinations in place and revives soft-deleted rows", async () => {
    // Arrange
    const siteId = await setupSiteWithUrl("www.alpha.gov.sg")
    const firstCsvPath = writeCsv(["www.alpha.gov.sg,/old-page,/first"])
    await importRedirectsFromCsv({ csvPath: firstCsvPath, dryRun: false })
    await db
      .updateTable("Redirect")
      .set({ deletedAt: new Date() })
      .where("siteId", "=", siteId)
      .execute()
    const secondCsvPath = writeCsv(["www.alpha.gov.sg,/old-page,/second"])

    // Act
    await importRedirectsFromCsv({ csvPath: secondCsvPath, dryRun: false })

    // Assert
    const redirects = await getRedirects(siteId)
    expect(redirects).toEqual([
      { source: "/old-page", destination: "/second", deletedAt: null },
    ])
  })

  it("bumps updatedAt when a re-run changes a destination in place", async () => {
    // Arrange — Kysely bypasses Prisma's @updatedAt, so the conflict update
    // must set it explicitly or it stays frozen at the original insert time
    const siteId = await setupSiteWithUrl("www.alpha.gov.sg")
    const firstCsvPath = writeCsv(["www.alpha.gov.sg,/old-page,/first"])
    await importRedirectsFromCsv({ csvPath: firstCsvPath, dryRun: false })
    const [before] = await db
      .selectFrom("Redirect")
      .select(["updatedAt"])
      .where("siteId", "=", siteId)
      .execute()
    const secondCsvPath = writeCsv(["www.alpha.gov.sg,/old-page,/second"])

    // Act
    await importRedirectsFromCsv({ csvPath: secondCsvPath, dryRun: false })

    // Assert
    const [after] = await db
      .selectFrom("Redirect")
      .select(["updatedAt"])
      .where("siteId", "=", siteId)
      .execute()
    expect(after?.updatedAt.getTime()).toBeGreaterThan(
      before?.updatedAt.getTime() ?? 0,
    )
  })

  it("throws a clear error when csvPath is empty", async () => {
    // Act
    const run = () => importRedirectsFromCsv({ csvPath: "", dryRun: true })

    // Assert
    await expect(run()).rejects.toThrow("csvPath is empty")
  })

  it("writes nothing in dry-run mode but still reports the summary", async () => {
    // Arrange
    const siteId = await setupSiteWithUrl("www.alpha.gov.sg")
    const csvPath = writeCsv(["www.alpha.gov.sg,/old-page,/new-page"])

    // Act
    const summary = await importRedirectsFromCsv({ csvPath, dryRun: true })

    // Assert
    const redirects = await getRedirects(siteId)
    expect(redirects).toHaveLength(0)
    expect(summary.sitesMatched).toBe(1)
    expect(summary.importedCount).toBe(1)
  })

  it("throws on an unexpected CSV header", async () => {
    // Arrange
    const csvPath = writeCsv(["www.alpha.gov.sg,/a,/b"], {
      header: "domain,from,to",
    })

    // Act
    const run = () => importRedirectsFromCsv({ csvPath, dryRun: true })

    // Assert
    await expect(run()).rejects.toThrow("Unexpected CSV header: domain,from,to")
  })
})
