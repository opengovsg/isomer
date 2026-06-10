import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { db, jsonb } from "~/server/modules/database"

import { resetTables } from "../../../tests/integration/helpers/db"
import { setupSite } from "../../../tests/integration/helpers/seed"
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
    await resetTables("Redirect", "Navbar", "Footer", "Site")
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
