import fs from "node:fs"
import { fileURLToPath } from "node:url"
import Papa from "papaparse"
import { z } from "zod"
import { db } from "~/server/modules/database"

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
  // Normalise to a single leading slash with no trailing slash, collapsing
  // runs of slashes so equivalent inputs map to the same source. This keeps
  // the (siteId, source) unique constraint meaningful.
  .transform((value) => `/${trimSlashes(value).replace(/\/{2,}/g, "/")}`)

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

export const importRedirectsFromCsv = async ({
  csvPath,
  dryRun,
}: ImportRedirectsFromCsvProps) => {
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

  const rowsToInsert = [...redirectsBySite.entries()].flatMap(
    ([siteId, siteRedirects]) =>
      [...siteRedirects.entries()].map(([source, destination]) => ({
        siteId,
        source,
        destination,
      })),
  )

  console.log(`Sites matched: ${redirectsBySite.size}`)
  console.log(`Redirects to import: ${rowsToInsert.length}`)
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

  const summary = {
    sitesMatched: redirectsBySite.size,
    importedCount: rowsToInsert.length,
    wildcardRowCount,
    queryParamRowCount,
    unmatchedDomains,
    invalidRows,
    duplicateRows,
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
        .onConflict((oc) =>
          oc.columns(["siteId", "source"]).doUpdateSet((eb) => ({
            destination: eb.ref("excluded.destination"),
            deletedAt: null,
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
