import { confirm, input, select } from "@inquirer/prompts"
import { formatInTimeZone } from "date-fns-tz"
import { mkdirSync, renameSync, writeFileSync } from "node:fs"
import path from "node:path"
import { Client } from "pg"

import { ENVIRONMENT_CHOICES } from "@isomer/export-import/constants"
import { getDbClientConfig } from "@isomer/export-import/db"

// Override either date here (YYYY-MM-DD), or accept/edit the defaults at the prompts.
const FROM_DATE = ""
const TO_DATE = ""
const DEFAULT_MONTHS = 3

interface Gazette {
  title: string
  ref: string
  category: string | null
  subCategory: string | null
  number: string | null
  date: string
}

interface GazetteRow extends Omit<Gazette, "ref" | "date"> {
  id: string
  ref: string | null
  date: string | null
}

export const isValidDate = (value: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return (
    Number.isFinite(date.getTime()) &&
    date.getUTCFullYear() > 0 &&
    date.toISOString().slice(0, 10) === value
  )
}

export const getDefaultDateRange = (now = new Date()) => {
  // Explicit "yyyy-MM-dd" token, rather than an Intl locale trick (e.g.
  // "en-CA"), which depends on ICU locale data and can silently format
  // differently on minimal-ICU runtimes.
  const to = formatInTimeZone(now, "Asia/Singapore", "yyyy-MM-dd")
  const from = new Date(`${to}T00:00:00Z`)
  const day = from.getUTCDate()
  from.setUTCMonth(from.getUTCMonth() - DEFAULT_MONTHS, 1)
  const lastDay = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth() + 1, 0),
  ).getUTCDate()
  from.setUTCDate(Math.min(day, lastDay))
  return { from: from.toISOString().slice(0, 10), to }
}

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")

const getPdfPath = (ref: string): string => {
  if (
    !ref.startsWith("/") ||
    ref.startsWith("//") ||
    ref.includes("\\") ||
    ref.split("/").some((part) => part === "." || part === "..")
  ) {
    throw new Error("Invalid PDF reference")
  }
  return ref.split("/").map(encodeURIComponent).join("/")
}

export const prepareGazettes = (
  rows: GazetteRow[],
  from: string,
  to: string,
) => {
  const gazettes: (Gazette & { sortDate: string })[] = []
  const warnings: string[] = []
  for (const row of rows) {
    const date = row.date ?? ""
    const sortDate = `${date.slice(6)}-${date.slice(3, 5)}-${date.slice(0, 2)}`
    if (!/^\d{2}\/\d{2}\/\d{4}$/.test(date) || !isValidDate(sortDate)) {
      warnings.push(`[${row.id}] Skipped: missing or invalid publication date.`)
      continue
    }
    if (sortDate < from || sortDate > to) continue

    const ref = row.ref ?? ""
    try {
      getPdfPath(ref)
    } catch {
      warnings.push(`[${row.id}] Skipped: missing or invalid PDF reference.`)
      continue
    }
    if (!row.category) {
      warnings.push(`[${row.id}] Missing category; displaying N/A.`)
    }
    if (!row.subCategory) {
      warnings.push(
        `[${row.id}] Missing or unknown subcategory; displaying N/A.`,
      )
    }
    gazettes.push({ ...row, ref, date, sortDate })
  }
  gazettes.sort((a, b) => b.sortDate.localeCompare(a.sortDate))
  return { gazettes, warnings }
}

export const generateHtml = (
  gazettes: Gazette[],
  domainName: string,
): string => {
  const origin = new URL(`https://${domainName}`)
  if (origin.host !== domainName || origin.username || origin.password) {
    throw new Error(
      "S3_GAZETTE_DOMAIN_NAME must be a hostname without a scheme or path",
    )
  }

  const items = gazettes.map((gazette) => {
    const url = `${origin.origin}${getPdfPath(gazette.ref)}`
    return `
      <li class="gazette-item">
        <a href="${escapeHtml(url)}" class="gazette-title" target="_blank" rel="noopener noreferrer">${escapeHtml(gazette.title)}</a>
        <div class="gazette-meta">Category: ${escapeHtml(gazette.category || "N/A")}, Sub-Category: ${escapeHtml(gazette.subCategory || "N/A")}</div>
        <div class="gazette-meta">Number: ${escapeHtml(gazette.number || "N/A")}</div>
        <div class="gazette-meta">Date of publication: ${escapeHtml(gazette.date)}</div>
      </li>`
  })

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Published Gazettes</title>
  <style>
    .gazette-browse { max-width: 1200px; margin: 0 auto; padding: 24px; font-family: sans-serif; }
    .gazette-list { list-style: none; margin: 0; padding: 20px; background: #fff; border: 1px solid #e0e0e0; border-radius: 6px; }
    .gazette-item { border-bottom: 1px solid #e0e0e0; padding: 16px 0; overflow-wrap: anywhere; }
    .gazette-item:last-child { border-bottom: none; }
    .gazette-title { font-size: 1.375rem; color: #1a0dab; text-decoration: underline; }
    .gazette-meta { color: #6e6e6e; font-size: 1.125rem; margin: 4px 0; }
  </style>
</head>
<body>
  <section aria-labelledby="gazette-heading">
    <div class="gazette-browse">
      <h1 id="gazette-heading">Browse</h1>
      ${items.length ? `<ul class="gazette-list">${items.join("")}\n      </ul>` : "<p>No published gazettes in this date range.</p>"}
    </div>
  </section>
</body>
</html>
`
}

export const createStaticPage = async (): Promise<void> => {
  const domainName = process.env.S3_GAZETTE_DOMAIN_NAME
  if (!domainName) {
    throw new Error("Set S3_GAZETTE_DOMAIN_NAME in egazette/.env")
  }
  // Validate the public hostname before opening a database connection.
  generateHtml([], domainName)

  const environment = await select({
    message: "Environment to export gazettes from",
    choices: ENVIRONMENT_CHOICES,
  })
  const siteId = await input({
    message: "Enter the eGazette site ID",
    validate: (value) =>
      (/^[1-9]\d*$/.test(value) && Number(value) <= 2147483647) ||
      "Enter a positive site ID",
  })
  const collectionId = await input({
    message: "Enter the gazette collection ID",
    validate: (value) =>
      (/^[1-9]\d*$/.test(value) && BigInt(value) <= 9223372036854775807n) ||
      "Enter a positive collection ID",
  })
  const to = await input({
    message: "To date, inclusive (YYYY-MM-DD, Singapore time)",
    default: TO_DATE || getDefaultDateRange().to,
    validate: (value) =>
      isValidDate(value) || "Enter a valid date as YYYY-MM-DD",
  })
  const from = await input({
    message: "From date, inclusive (YYYY-MM-DD, Singapore time)",
    default:
      FROM_DATE || getDefaultDateRange(new Date(`${to}T00:00:00+08:00`)).from,
    validate: (value) =>
      (isValidDate(value) && value <= to) ||
      "Enter a valid date on or before the to date",
  })

  const client = new Client({
    ...(await getDbClientConfig(environment)),
    options: "-c default_transaction_read_only=on",
  })
  try {
    await client.connect()
    const { rows: collections } = await client.query<{
      siteName: string
      collectionTitle: string
    }>(
      `SELECT s.name AS "siteName", r.title AS "collectionTitle"
       FROM "Site" s
       JOIN "Resource" r ON r."siteId" = s.id
       WHERE s.id = $1 AND r.id = $2 AND r.type = 'Collection'`,
      [siteId, collectionId],
    )
    const collection = collections[0]
    if (!collection) {
      throw new Error(
        `Collection ${collectionId} does not exist in site ${siteId}`,
      )
    }
    console.log(
      `Exporting ${collection.siteName} / ${collection.collectionTitle}`,
    )

    // Only published blobs are public. page.date retains the gazette's publication
    // date, whereas Version.publishedAt changes when a version is republished.
    // Validate dates in JS so malformed records cannot abort the SQL query.
    // ponytail: load collection metadata at once; stream if its history outgrows memory.
    const { rows } = await client.query<GazetteRow>(
      `WITH subcategories AS (
         SELECT option->>'id' AS id, option->>'label' AS label
         FROM "Resource" i
         JOIN "Version" iv ON iv.id = i."publishedVersionId"
         JOIN "Blob" ib ON ib.id = iv."blobId"
         CROSS JOIN LATERAL jsonb_array_elements(
           CASE WHEN jsonb_typeof(ib.content #> '{page,tagCategories}') = 'array'
             THEN ib.content #> '{page,tagCategories}' ELSE '[]'::jsonb END
         ) AS category
         CROSS JOIN LATERAL jsonb_array_elements(
           CASE WHEN jsonb_typeof(category->'options') = 'array'
             THEN category->'options' ELSE '[]'::jsonb END
         ) AS option
         WHERE i."siteId" = $1 AND i."parentId" = $2 AND i.type = 'IndexPage'
       )
       SELECT r.id::text AS id, r.title,
              b.content #>> '{page,ref}' AS ref,
              b.content #>> '{page,category}' AS category,
              (SELECT label FROM subcategories
               WHERE id = b.content #>> '{page,tagged,0}' LIMIT 1) AS "subCategory",
              b.content #>> '{page,description}' AS number,
              b.content #>> '{page,date}' AS date
       FROM "Resource" r
       JOIN "Version" v ON v.id = r."publishedVersionId"
       JOIN "Blob" b ON b.id = v."blobId"
       WHERE r."siteId" = $1 AND r."parentId" = $2
         AND r.type = 'CollectionLink'
       ORDER BY v."publishedAt" DESC, r.id DESC`,
      [siteId, collectionId],
    )
    const { gazettes, warnings } = prepareGazettes(rows, from, to)
    for (const warning of warnings) console.warn(warning)
    console.log(
      `Selected ${gazettes.length} gazettes; ${warnings.length} warnings.`,
    )
    if (
      gazettes.length === 0 &&
      !(await confirm({
        message:
          "No gazettes to export. Write an empty page and replace any existing gazettes.html?",
        default: false,
      }))
    ) {
      console.log("No file written.")
      return
    }

    const html = generateHtml(gazettes, domainName)
    const outputDir = path.join(__dirname, "..", "output")
    const outputPath = path.join(outputDir, "gazettes.html")
    mkdirSync(outputDir, { recursive: true })
    writeFileSync(`${outputPath}.tmp`, html, "utf-8")
    renameSync(`${outputPath}.tmp`, outputPath)
    console.log(
      `Generated ${outputPath} (${gazettes.length} items) from ${from} to ${to}`,
    )
  } finally {
    await client.end()
  }
}
