import fs from "node:fs"
import path, { dirname } from "node:path"
import { fileURLToPath } from "node:url"
import Papa from "papaparse"

const __dirname = dirname(fileURLToPath(import.meta.url))

// A browser-like User-Agent so the WAF in front of the published sites doesn't
// block the probe as an automated client (a default fetch/curl agent gets 403s).
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

interface VerifyRedirectsLiveProps {
  // A `domainName,source,target` CSV. Prefer the `migrated-redirects.csv` that a
  // real import writes (under prisma/scripts/output) — it contains exactly the
  // rows that were migrated, with the target set to the Location the published
  // redirect should emit, so there are no unmatched-domain false failures. The
  // original infra CSV also works, but will report un-migrated domains as errors.
  csvPath: string
  // Only verify this domain (bare hostname, e.g. "www.isomer.gov.sg"). Leave
  // empty to verify every domain in the CSV.
  domainFilter: string
  // Per-domain cap on how many redirects to probe (0 = all). A small sample
  // gives a quick signal; 0 exhaustively checks every redirect.
  sampleSize: number
  // Number of concurrent HTTP requests against the live site.
  concurrency: number
  // The status code a working redirect should return (CloudFront issues 301).
  expectedStatus: number
  // Per-request timeout in milliseconds.
  timeoutMs: number
  // When true, only report how many redirects would be probed per domain
  // without making any HTTP request.
  dryRun: boolean
}

// Reduces a domain to a bare lowercase hostname, mirroring
// importRedirectsFromCsv.ts so the two agree on what a site's domain is.
const normaliseDomain = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "")

const trimSlashes = (value: string) => value.replace(/^\/+|\/+$/g, "")

type Outcome = "ok" | "wrong-status" | "wrong-location" | "error"

interface Probe {
  domain: string
  source: string
  expectedTarget: string
}

interface Result extends Probe {
  outcome: Outcome
  status: number | null
  location: string | null
  detail: string
}

// Resolves a (possibly relative) Location against the request URL and strips a
// single trailing slash, so "/foo" and "/foo/" — and absolute vs relative forms
// of the same target — compare equal.
const canonicalUrl = (value: string, base: string) => {
  try {
    const url = new URL(value, base)
    url.pathname = url.pathname.replace(/\/+$/, "") || "/"
    return url.href
  } catch {
    return value
  }
}

const probeOne = async (
  probe: Probe,
  { expectedStatus, timeoutMs }: VerifyRedirectsLiveProps,
): Promise<Result> => {
  const requestUrl = `https://${probe.domain}/${trimSlashes(probe.source)}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(requestUrl, {
      method: "GET",
      redirect: "manual",
      headers: { "user-agent": USER_AGENT },
      signal: controller.signal,
    })
    const location = res.headers.get("location")
    const base = { ...probe, status: res.status, location }
    if (res.status !== expectedStatus) {
      return {
        ...base,
        outcome: "wrong-status",
        detail: `expected ${expectedStatus}, got ${res.status}`,
      }
    }
    // The 301 fired (the thing we're verifying). Flag a mismatched Location as a
    // softer finding — at migration time it should still match the CSV target.
    if (
      location === null ||
      canonicalUrl(location, requestUrl) !==
        canonicalUrl(probe.expectedTarget, requestUrl)
    ) {
      return {
        ...base,
        outcome: "wrong-location",
        detail: `expected Location "${probe.expectedTarget}", got "${location ?? "(none)"}"`,
      }
    }
    return { ...base, outcome: "ok", detail: "" }
  } catch (error) {
    return {
      ...probe,
      outcome: "error",
      status: null,
      location: null,
      detail: error instanceof Error ? error.message : String(error),
    }
  } finally {
    clearTimeout(timer)
  }
}

// Worker-pool: each worker pulls from the shared queue until it is empty,
// mirroring uploadRedirects.ts so we don't open thousands of sockets at once.
const runWithConcurrency = async (
  probes: Probe[],
  props: VerifyRedirectsLiveProps,
): Promise<Result[]> => {
  const queue = probes.slice()
  const results: Result[] = []
  let done = 0
  const worker = async () => {
    while (queue.length > 0) {
      const probe = queue.shift()
      if (!probe) break
      results.push(await probeOne(probe, props))
      done += 1
      if (done % 500 === 0) {
        console.log(`Probed ${done}/${probes.length}`)
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(props.concurrency, probes.length) }, worker),
  )
  return results
}

export const verifyRedirectsLive = async (props: VerifyRedirectsLiveProps) => {
  const { csvPath, domainFilter, sampleSize, dryRun } = props

  if (!csvPath) {
    throw new Error(
      "csvPath is empty - set the csvPath variable at the bottom of the script before running.",
    )
  }

  // Papa handles standard CSV quoting and CRLF; the BOM is stripped up front so
  // spreadsheet-exported files don't fail the header check (mirrors the import).
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

  const target = domainFilter ? normaliseDomain(domainFilter) : null
  const byDomain = new Map<string, Probe[]>()
  for (const row of dataRows) {
    if (row.length !== 3) continue
    const [domainName = "", source = "", csvTarget = ""] = row.map((field) =>
      field.trim(),
    )
    // Wildcard / query-parameter rows are not imported, so they won't redirect
    // — skip them to avoid false failures (mirrors the import).
    if (
      source.includes("*") ||
      csvTarget.includes("*") ||
      source.includes("?") ||
      csvTarget.includes("?")
    ) {
      continue
    }
    const domain = normaliseDomain(domainName)
    if (!domain || !trimSlashes(source)) continue
    if (target && domain !== target) continue
    const list = byDomain.get(domain) ?? []
    byDomain.set(domain, list)
    list.push({ domain, source, expectedTarget: csvTarget })
  }

  const probes: Probe[] = []
  for (const [domain, list] of byDomain) {
    const sliced = sampleSize > 0 ? list.slice(0, sampleSize) : list
    probes.push(...sliced)
    console.log(
      `${domain}: ${list.length} redirect(s)` +
        (sampleSize > 0 ? `, probing ${sliced.length}` : ""),
    )
  }

  console.log(`Total redirects to verify: ${probes.length}`)
  if (dryRun) {
    console.log("Dry run - no requests made. Set dryRun to false to probe.")
    return { probes, results: [] as Result[] }
  }

  const results = await runWithConcurrency(probes, props)
  const failures = results.filter((r) => r.outcome !== "ok")

  const byOutcome = (outcome: Outcome) =>
    results.filter((r) => r.outcome === outcome).length
  console.log(`\nVerified ${results.length} redirect(s):`)
  console.log(`  OK:             ${byOutcome("ok")}`)
  console.log(`  Wrong status:   ${byOutcome("wrong-status")}`)
  console.log(`  Wrong location: ${byOutcome("wrong-location")}`)
  console.log(`  Errors:         ${byOutcome("error")}`)

  for (const f of failures) {
    console.warn(
      `[${f.outcome}] ${f.domain}/${trimSlashes(f.source)} -> ${f.detail}`,
    )
  }

  if (failures.length > 0) {
    const outputDir = path.join(__dirname, "output")
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir)
    const outputPath = path.join(
      outputDir,
      "redirect-verification-failures.csv",
    )
    fs.writeFileSync(
      outputPath,
      Papa.unparse({
        fields: [
          "domain",
          "source",
          "expectedTarget",
          "outcome",
          "status",
          "location",
          "detail",
        ],
        data: failures.map((f) => [
          f.domain,
          f.source,
          f.expectedTarget,
          f.outcome,
          f.status ?? "",
          f.location ?? "",
          f.detail,
        ]),
      }),
    )
    console.log(`\nFailures written to ${outputPath}`)
  }

  return { probes, results }
}

// Only run when executed directly, not when imported by tests
const isMain = process.argv[1] === fileURLToPath(import.meta.url)
if (isMain) {
  // NOTE: set csvPath, run against staging first, then set dryRun to false.
  const props: VerifyRedirectsLiveProps = {
    csvPath: "",
    domainFilter: "",
    sampleSize: 0,
    concurrency: 10,
    expectedStatus: 301,
    timeoutMs: 10_000,
    dryRun: true,
  }

  await verifyRedirectsLive(props)
}
