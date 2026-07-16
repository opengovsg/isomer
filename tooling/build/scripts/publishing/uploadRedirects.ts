import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import * as fs from "fs"
import { argv } from "process"
import { pathToFileURL } from "url"

const REDIRECTS_JSON = process.env.REDIRECTS_JSON
const S3_BUCKET = process.env.S3_BUCKET_NAME
const SITE_NAME = process.env.SITE_NAME
const BUILD_NUMBER = process.env.CODEBUILD_BUILD_NUMBER
const DEFAULT_CONCURRENCY = 20

interface Redirect {
  source: string
  destination: string
}

/** Prefer S3_SYNC_CONCURRENCY from publisher.sh; fall back if unset/invalid. */
export function resolveConcurrency(
  raw: string | undefined = process.env.S3_SYNC_CONCURRENCY,
): number {
  const parsed = raw === undefined ? NaN : Number.parseInt(raw, 10)
  if (!Number.isFinite(parsed) || parsed < 1) return DEFAULT_CONCURRENCY
  return parsed
}

// Returns the normalised S3 key segment, or null if the source is unsafe/empty.
export function normalizeSource(source: string): string | null {
  if (typeof source !== "string") return null
  // A stored source keeps its percent-encoding (the source schema forbids a raw
  // space, so a space is persisted as "%20"). CloudFront percent-decodes the
  // request path before it fetches from S3, so the object must be keyed by the
  // DECODED path — otherwise it sits at a "%20" key that no request ever reaches.
  // Decode first, then run the safety checks below on the decoded value so an
  // encoded "%2e%2e" or "%00" can't smuggle a traversal / control char past them.
  let decoded: string
  try {
    decoded = decodeURIComponent(source)
  } catch {
    // Malformed percent-encoding (e.g. a lone "%") can't be keyed correctly.
    return null
  }
  // Reject control chars and backslashes
  if (/[\x00-\x1f\x7f\\]/.test(decoded)) return null
  const trimmed = decoded
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/+/g, "/")
  if (!trimmed) return null
  // Reject any path-traversal segment
  if (trimmed.split("/").some((seg) => seg === "..")) return null
  return trimmed
}

async function uploadOne(
  client: S3Client,
  source: string,
  destination: string,
): Promise<void> {
  // Mirror the CloudFront redirect function's assumption (see
  // generateRedirectFnCode in isomer-next-infra): if the last 5 characters
  // contain a ".", the source is treated as a file path and used as-is.
  // Otherwise it is a directory path and resolves to its "/index.html" object.
  const isPotentialFilePath = source.slice(-5).includes(".")
  const key = isPotentialFilePath ? source : `${source}/index.html`

  await client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: `${SITE_NAME}/${BUILD_NUMBER}/latest/${key}`,
      // Empty Buffer (not "") so the SDK knows Content-Length upfront and
      // does not warn about a stream of unknown length.
      Body: Buffer.alloc(0),
      ContentLength: 0,
      ContentType: "text/html",
      CacheControl: "max-age=600",
      // Becomes x-amz-meta-redirect-destination on the object.
      Metadata: { "redirect-destination": destination },
    }),
  )
}

// Worker-pool: each worker pulls from the shared queue until it is empty.
async function runWithConcurrency(
  client: S3Client,
  items: Redirect[],
  limit: number,
): Promise<{ failed: number }> {
  const queue = items.slice()
  let failed = 0
  const worker = async () => {
    while (queue.length > 0) {
      const r = queue.shift()
      if (!r) break
      try {
        await uploadOne(client, r.source, r.destination)
      } catch (err) {
        console.error("Redirect upload failed:", err)
        failed++
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  )
  return { failed }
}

async function main(): Promise<void> {
  if (!REDIRECTS_JSON || !S3_BUCKET || !SITE_NAME || !BUILD_NUMBER) {
    throw new Error(
      "Missing required env vars: REDIRECTS_JSON, S3_BUCKET_NAME, SITE_NAME, CODEBUILD_BUILD_NUMBER",
    )
  }

  const raw: Redirect[] = JSON.parse(fs.readFileSync(REDIRECTS_JSON, "utf-8"))
  console.log(`Loaded ${raw.length} redirect row(s) from ${REDIRECTS_JSON}`)

  const seen = new Set<string>()
  const valid: Redirect[] = []
  for (const r of raw) {
    const source = normalizeSource(r.source)
    if (!source) {
      console.warn(
        `Skipping invalid redirect source: ${JSON.stringify(r.source)}`,
      )
      continue
    }
    if (seen.has(source)) {
      console.warn(`Skipping duplicate normalised source: ${source}`)
      continue
    }
    if (!/^(https?:\/\/|\/)/.test(r.destination)) {
      console.warn(
        `Destination "${r.destination}" is not absolute; browsers may interpret it inconsistently.`,
      )
    }
    seen.add(source)
    valid.push({ source, destination: r.destination })
  }

  if (valid.length === 0) {
    console.log("No valid redirects to upload.")
    return
  }

  // Region/credentials come from the environment (CodeBuild IAM role +
  // AWS_REGION), same as `aws s3 cp` previously.
  const client = new S3Client({})
  const concurrency = resolveConcurrency()

  console.log(
    `Uploading ${valid.length} redirect(s) with concurrency ${concurrency}...`,
  )
  const { failed } = await runWithConcurrency(client, valid, concurrency)
  console.log(`Uploaded ${valid.length - failed}/${valid.length} redirects.`)
  if (failed > 0) process.exit(1)
}

// Run only when executed directly (`tsx uploadRedirects.ts`), not when the file
// is imported — e.g. by the unit tests for normalizeSource.
if (argv[1] && import.meta.url === pathToFileURL(argv[1]).href) {
  main().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
