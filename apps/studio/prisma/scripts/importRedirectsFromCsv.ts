import fs from "node:fs"
import { fileURLToPath } from "node:url"
import Papa from "papaparse"
import { z } from "zod"
import { db, ResourceType } from "~/server/modules/database"

// Inline copy of createRedirectSchema from ~/schemas/redirect on the
// feat/redirects-management-backend branch, so this script can land off main
// without depending on that branch. Once the redirects backend merges, drop
// this block and import the schema instead so the two cannot drift.
const MAX_REDIRECT_PATH_LENGTH = 2000

// Matches ASCII control characters (0x00-0x1f, 0x7f) and backslashes.
// These are never valid in a URL path and can corrupt the generated
// redirect rules on the published site.
const INVALID_PATH_CHARS_REGEX = /[\x00-\x1f\x7f\\]/

// Strips slashes from both ends of a path so "/foo/", "foo" and "foo//"
// all normalise to the same inner segments before validation.
const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, "")

// Normalises a path to a single leading slash, no trailing slash, collapsed
// runs of slashes — so "/foo/", "foo" and "foo//" all map to "/foo".
const normalizeRedirectPath = (value: string) =>
  `/${trimSlashes(value).replace(/\/{2,}/g, "/")}`

// Page permalinks are lowercase-only, so an internal destination is compared
// against the live-permalink map in lowercase too — otherwise a mixed-case CSV
// target (e.g. "/About-Us") would miss the "/about-us" key and fall back to a
// literal path instead of resolving to a [resource:...] reference.
const normalizeRedirectSource = (value: string) =>
  normalizeRedirectPath(value).toLowerCase()

const sourceSchema = z
  .string()
  .min(1, { message: "Source path is required" })
  .max(MAX_REDIRECT_PATH_LENGTH, { message: "Source path is too long" })
  .refine((value) => !INVALID_PATH_CHARS_REGEX.test(value), {
    message: "Source must not contain control characters or backslashes",
  })
  .refine((value) => trimSlashes(value).length > 0, {
    message: "Source path cannot consist only of slashes",
  })
  .refine((value) => !trimSlashes(value).split("/").includes(".."), {
    message: "Source must not contain '..' path segments",
  })
  // Normalise so equivalent inputs map to the same source, keeping the
  // (siteId, source) unique constraint meaningful.
  .transform(normalizeRedirectPath)

const destinationSchema = z
  .string()
  .min(1, { message: "Destination is required" })
  .max(MAX_REDIRECT_PATH_LENGTH, { message: "Destination is too long" })
  // Destinations must be a path on the same site ("/...") or an external
  // https URL — anything else (http://, javascript:, ...) is rejected.
  .refine((value) => value.startsWith("/") || value.startsWith("https://"), {
    message: "Destination must start with '/' or 'https://'",
  })

const createRedirectSchema = z.object({
  source: sourceSchema,
  destination: destinationSchema,
})

interface ImportRedirectsFromCsvProps {
  // CSV with a `domainName,source,target` header, e.g.
  // isomer-next-infra/src/publishing/redirects.production.csv
  csvPath: string
  dryRun: boolean
}

// Rows are inserted in chunks so a 38k-row import doesn't build one giant
// INSERT statement; the whole import still runs in a single transaction.
const INSERT_CHUNK_SIZE = 1000

// Reduces a site URL or CSV domain to a bare lowercase hostname so the two
// can be compared: strips an optional scheme, then anything from the first
// "/" onwards. `Site.config.url` is stored as a bare domain today, but this
// keeps the match working if a value ever includes a scheme or trailing slash.
const normaliseDomain = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")

// The form internal destinations are stored in (matches Studio / the publish
// resolver), so the redirect follows the page if its permalink later changes.
const toReferenceLink = (siteId: number, resourceId: number) =>
  `[resource:${siteId}:${resourceId}]`

const INDEX_PAGE_PERMALINK = "_index"

// An empty permalink (the root) or an "_index" segment contributes no path
// segment to a full permalink.
const isIndexOrRoot = (permalink: string) =>
  permalink === "" || permalink === INDEX_PAGE_PERMALINK

// Maps every live, addressable full permalink on a site to the resource id a
// redirect destination should reference, mirroring how Studio stores internal
// destinations: a published page references itself; a Folder/Collection
// references the container (its index page id never appears in the built site)
// and is addressable only when its index page is published. The full permalink
// of each resource is built by walking the parent chain in memory; root (empty
// permalink) and "_index" segments contribute no path segment.
const buildPermalinkToResourceId = async (siteId: number) => {
  const resources = await db
    .selectFrom("Resource")
    .where("siteId", "=", siteId)
    .select(["id", "permalink", "parentId", "type", "publishedVersionId"])
    .execute()

  const byId = new Map(
    resources.map((resource) => [String(resource.id), resource]),
  )

  // Container ids that have a published index page child (so the container is
  // live and addressable at its own URL).
  const publishedContainerIds = new Set(
    resources
      .filter(
        (resource) =>
          resource.type === ResourceType.IndexPage &&
          resource.publishedVersionId !== null &&
          resource.parentId !== null,
      )
      .map((resource) => String(resource.parentId)),
  )

  const cache = new Map<string, string>()
  // Guards against a parentId cycle in corrupt data (A -> B -> A), which would
  // otherwise recurse until the call stack overflows.
  const fullPermalinkOf = (id: string, visited = new Set<string>()): string => {
    const cached = cache.get(id)
    if (cached !== undefined) return cached
    if (visited.has(id)) return "/"
    visited.add(id)
    const resource = byId.get(id)
    if (!resource) return "/"
    const segment = isIndexOrRoot(resource.permalink) ? "" : resource.permalink
    let result: string
    if (resource.parentId === null) {
      result = segment === "" ? "/" : `/${segment}`
    } else {
      const parentPath = fullPermalinkOf(String(resource.parentId), visited)
      result =
        segment === ""
          ? parentPath
          : `${parentPath === "/" ? "" : parentPath}/${segment}`
    }
    cache.set(id, result)
    return result
  }

  const permalinkToResourceId = new Map<string, number>()
  for (const resource of resources) {
    const id = String(resource.id)
    const isLivePage =
      (resource.type === ResourceType.Page ||
        resource.type === ResourceType.CollectionPage ||
        resource.type === ResourceType.RootPage) &&
      resource.publishedVersionId !== null
    const isLiveContainer =
      (resource.type === ResourceType.Folder ||
        resource.type === ResourceType.Collection) &&
      publishedContainerIds.has(id)
    if (isLivePage || isLiveContainer) {
      // Lowercase the key so the lowercased destination lookup below matches.
      permalinkToResourceId.set(
        fullPermalinkOf(id).toLowerCase(),
        Number(resource.id),
      )
    }
  }
  return permalinkToResourceId
}

export const importRedirectsFromCsv = async ({
  csvPath,
  dryRun,
}: ImportRedirectsFromCsvProps) => {
  // Surface a clear message instead of an opaque ENOENT when csvPath is unset.
  if (!csvPath) {
    throw new Error(
      "csvPath is empty - set the csvPath variable at the bottom of the script before running.",
    )
  }
  // Papa handles standard CSV quoting (fields containing commas) and CRLF
  // line endings; the BOM is stripped up front so spreadsheet-exported files
  // don't fail the header check below.
  const { data: rows, errors: parseErrors } = Papa.parse<string[]>(
    fs.readFileSync(csvPath, "utf8").replace(/^\uFEFF/, ""),
    { skipEmptyLines: true },
  )
  for (const error of parseErrors) {
    console.warn(`CSV parse warning at row ${error.row}: ${error.message}`)
  }

  const [header = [], ...dataRows] = rows
  if (
    header.map((field) => field.trim()).join(",") !== "domainName,source,target"
  ) {
    throw new Error(`Unexpected CSV header: ${header.join(",")}`)
  }

  const sites = await db.selectFrom("Site").select(["id", "config"]).execute()
  const siteIdByDomain = new Map<string, number>()
  for (const site of sites) {
    if (site.config.url) {
      siteIdByDomain.set(normaliseDomain(site.config.url), site.id)
    }
  }

  const unmatchedDomains = new Map<string, number>()
  const invalidRows: { lineNumber: number; line: string; reason: string }[] = []
  const duplicateRows: { lineNumber: number; line: string }[] = []
  const redirectsBySite = new Map<number, Map<string, string>>()
  let wildcardRowCount = 0
  let queryParamRowCount = 0

  dataRows.forEach((row, index) => {
    // CSV header line is 1, so the first data line is 2
    const lineNumber = index + 2
    const line = row.join(",")
    if (row.length !== 3) {
      invalidRows.push({
        lineNumber,
        line,
        reason: `Expected 3 comma-separated fields, got ${row.length}`,
      })
      return
    }
    const [domainName = "", source = "", target = ""] = row.map((field) =>
      field.trim(),
    )

    // Wildcard rules and query-parameter matching are infra publishing
    // features with no equivalent in the Redirect table's exact-match
    // semantics - skip them rather than import rules that behave differently
    if (source.includes("*") || target.includes("*")) {
      wildcardRowCount += 1
      return
    }
    if (source.includes("?") || target.includes("?")) {
      queryParamRowCount += 1
      return
    }

    const siteId = siteIdByDomain.get(normaliseDomain(domainName))
    if (siteId === undefined) {
      const domain = normaliseDomain(domainName)
      unmatchedDomains.set(domain, (unmatchedDomains.get(domain) ?? 0) + 1)
      return
    }

    // Validate with the same rules as the Studio publish flow so imported
    // rows are normalised exactly like redirects created through Studio
    const parsed = createRedirectSchema.safeParse({
      source,
      destination: target,
    })
    if (!parsed.success) {
      invalidRows.push({
        lineNumber,
        line,
        reason: parsed.error.issues.map((issue) => issue.message).join("; "),
      })
      return
    }

    // Distinct CSV sources can normalise to the same value (e.g. "/foo" and
    // "/foo/"). Keep the first occurrence so the import is deterministic, and
    // surface the dropped row for manual review.
    const siteRedirects =
      redirectsBySite.get(siteId) ?? new Map<string, string>()
    redirectsBySite.set(siteId, siteRedirects)
    if (siteRedirects.has(parsed.data.source)) {
      duplicateRows.push({ lineNumber, line })
      return
    }
    siteRedirects.set(parsed.data.source, parsed.data.destination)
  })

  // Resolve destinations to the stored form. An internal path that resolves to
  // a live page/folder becomes a [resource:...] reference so the redirect
  // follows the page if its permalink later changes; an external https URL is
  // stored verbatim. An internal path with no matching live page is kept as a
  // literal path (it still redirects, it just won't track future moves) and
  // surfaced for review.
  const rowsToInsert: {
    siteId: number
    source: string
    destination: string
  }[] = []
  const unresolvedDestinations: {
    siteId: number
    source: string
    destination: string
  }[] = []
  let referenceCount = 0
  for (const [siteId, siteRedirects] of redirectsBySite) {
    const permalinkToResourceId = await buildPermalinkToResourceId(siteId)
    for (const [source, destination] of siteRedirects) {
      if (destination.startsWith("https://")) {
        rowsToInsert.push({ siteId, source, destination })
        continue
      }
      const resourceId = permalinkToResourceId.get(
        normalizeRedirectSource(destination),
      )
      if (resourceId === undefined) {
        unresolvedDestinations.push({ siteId, source, destination })
        rowsToInsert.push({ siteId, source, destination })
        continue
      }
      referenceCount += 1
      rowsToInsert.push({
        siteId,
        source,
        destination: toReferenceLink(siteId, resourceId),
      })
    }
  }

  console.log(`Sites matched: ${redirectsBySite.size}`)
  console.log(`Redirects to import: ${rowsToInsert.length}`)
  console.log(
    `Internal destinations converted to references: ${referenceCount}`,
  )
  console.log(`Wildcard rows ignored: ${wildcardRowCount}`)
  console.log(`Query-parameter rows ignored: ${queryParamRowCount}`)
  for (const [domain, count] of unmatchedDomains) {
    console.warn(
      `Unmatched domain (no site with this config.url): ${domain} (${count} rows skipped)`,
    )
  }
  for (const { lineNumber, line, reason } of invalidRows) {
    console.warn(`Invalid row at line ${lineNumber} (${reason}): ${line}`)
  }
  for (const { lineNumber, line } of duplicateRows) {
    console.warn(
      `Duplicate source after normalisation at line ${lineNumber} (kept first occurrence): ${line}`,
    )
  }
  for (const { siteId, source, destination } of unresolvedDestinations) {
    console.warn(
      `Internal destination kept as a literal path (no live page at it): site ${siteId} ${source} -> ${destination}`,
    )
  }

  const summary = {
    sitesMatched: redirectsBySite.size,
    importedCount: rowsToInsert.length,
    referenceCount,
    wildcardRowCount,
    queryParamRowCount,
    unmatchedDomains,
    invalidRows,
    duplicateRows,
    unresolvedDestinations,
  }

  if (dryRun) {
    console.log("Dry run - no rows written. Set dryRun to false to import.")
    return summary
  }

  await db.transaction().execute(async (tx) => {
    for (let i = 0; i < rowsToInsert.length; i += INSERT_CHUNK_SIZE) {
      await tx
        .insertInto("Redirect")
        .values(rowsToInsert.slice(i, i + INSERT_CHUNK_SIZE))
        // Re-running the import updates destinations in place and revives
        // soft-deleted rows, mirroring the publish flow - the script is
        // idempotent
        // Kysely bypasses Prisma's client-side `@updatedAt`, so set updatedAt
        // explicitly on conflict - otherwise it stays frozen at the original
        // insert time when a re-run changes a destination
        .onConflict((oc) =>
          oc.columns(["siteId", "source"]).doUpdateSet((eb) => ({
            destination: eb.ref("excluded.destination"),
            deletedAt: null,
            updatedAt: new Date(),
          })),
        )
        .execute()
      console.log(
        `Inserted ${Math.min(i + INSERT_CHUNK_SIZE, rowsToInsert.length)}/${rowsToInsert.length} redirects`,
      )
    }
  })

  console.log("Import complete")
  return summary
}

// Only run when executed directly, not when imported by tests
const isMain = process.argv[1] === fileURLToPath(import.meta.url)
if (isMain) {
  // NOTE: Update the CSV path and set dryRun to false before executing!
  const csvPath = ""
  const dryRun = true

  try {
    await importRedirectsFromCsv({ csvPath, dryRun })
  } finally {
    // Always release the connection pool, even when the import throws, so
    // the process does not hang on an open DB connection
    await db.destroy()
  }
}
