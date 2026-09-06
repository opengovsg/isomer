import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3"
import fs from "node:fs"
import { argv } from "node:process"
import { pathToFileURL } from "node:url"
import { parseArgs } from "node:util"

import { redirectsFileSchema } from "./schemas"

const DEFAULT_CONCURRENCY = 20

const uploadCliOptions = {
  "build-number": { type: "string" },
  concurrency: { type: "string" },
  "redirects-json": { type: "string" },
  "s3-bucket-name": { type: "string" },
  "site-name": { type: "string" },
} as const

interface Redirect {
  source: string
  destination: string
}

export interface UploadConfig {
  redirectsJson: string
  s3BucketName: string
  siteName: string
  buildNumber: string
  concurrency: number
}

interface PartitionedRedirects {
  exact: Redirect[]
  manifestEntries: Redirect[]
}

interface RedirectManifest {
  version: number
  redirects: Record<string, string>
}

export const parseUploadCliArgs = (args: readonly string[] = argv) =>
  parseArgs({
    args: args.slice(2),
    options: uploadCliOptions,
    strict: false,
  }).values

/** Prefer CLI / S3_SYNC_CONCURRENCY from publisher.sh; fall back if unset/invalid. */
export const resolveConcurrency = (
  raw: string | undefined = process.env.S3_SYNC_CONCURRENCY,
): number => {
  const parsed = raw === undefined ? Number.NaN : Math.trunc(Number(raw))
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_CONCURRENCY
  }
  return parsed
}

const hasRequiredUploadInputs = (
  redirectsJson: string | undefined,
  s3BucketName: string | undefined,
  siteName: string | undefined,
  buildNumber: string | undefined,
): boolean =>
  redirectsJson !== undefined &&
  redirectsJson !== "" &&
  s3BucketName !== undefined &&
  s3BucketName !== "" &&
  siteName !== undefined &&
  siteName !== "" &&
  buildNumber !== undefined &&
  buildNumber !== ""

/** CLI flags from publisher.sh take precedence; env vars remain for local runs. */
export const resolveUploadConfig = (
  args: readonly string[] = argv,
): UploadConfig | null => {
  const values = parseUploadCliArgs(args)

  const redirectsJson = values["redirects-json"] ?? process.env.REDIRECTS_JSON
  const s3BucketName = values["s3-bucket-name"] ?? process.env.S3_BUCKET_NAME
  const siteName = values["site-name"] ?? process.env.SITE_NAME
  const buildNumber =
    values["build-number"] ?? process.env.CODEBUILD_BUILD_NUMBER

  if (
    !hasRequiredUploadInputs(redirectsJson, s3BucketName, siteName, buildNumber)
  ) {
    return null
  }

  return {
    buildNumber,
    concurrency: resolveConcurrency(
      values.concurrency ?? process.env.S3_SYNC_CONCURRENCY,
    ),
    redirectsJson,
    s3BucketName,
    siteName,
  }
}

const hasControlChars = (value: string): boolean => {
  for (const char of value) {
    const code = char.codePointAt(0) ?? 0
    if (code <= 0x1f || code === 0x7f || char === "\\") {
      return true
    }
  }
  return false
}

// Returns the normalised S3 key segment, or null if the source is unsafe/empty.
export const normalizeSource = (source: string): string | null => {
  let decoded: string
  try {
    decoded = decodeURIComponent(source)
  } catch {
    return null
  }

  if (hasControlChars(decoded)) {
    return null
  }

  const trimmed = decoded
    .replace(/^\/+/u, "")
    .replace(/\/+$/u, "")
    .replaceAll(/\/+/gu, "/")

  if (trimmed.length === 0) {
    return null
  }

  const segments = trimmed.split("/")
  for (const segment of segments) {
    if (segment === "..") {
      return null
    }
  }

  return trimmed
}

export const isSelfReferentialRedirect = ({
  source,
  destination,
}: Redirect): boolean => {
  if (!destination.startsWith("/")) {
    return false
  }

  const sourcePath = source.endsWith("/*") ? source.slice(0, -2) : source
  const [destinationPath] = destination.split(/[?#]/u, 1)
  const normalizedSource = normalizeSource(sourcePath)
  const normalizedDestination =
    destinationPath.length === 0 ? null : normalizeSource(destinationPath)

  return normalizedSource !== null && normalizedSource === normalizedDestination
}

export const MANIFEST_KEY_SUFFIX = "_redirects/manifest.json"

const isManifestKind = (source: string): boolean => source.endsWith("/*")

export const partitionRedirects = (rows: Redirect[]): PartitionedRedirects => {
  const exact: Redirect[] = []
  const manifestEntries: Redirect[] = []
  for (const row of rows) {
    if (isManifestKind(row.source)) {
      manifestEntries.push(row)
    } else {
      exact.push(row)
    }
  }
  return { exact, manifestEntries }
}

export const MANIFEST_VERSION = 1

export const buildManifest = (entries: Redirect[]): RedirectManifest => {
  const redirects: Record<string, string> = {}
  for (const { source, destination } of entries) {
    if (redirects[source] !== undefined) {
      console.warn(
        `Skipping duplicate wildcard source in manifest: ${source} (keeping first destination "${redirects[source]}")`,
      )
      continue
    }
    redirects[source] = destination
  }
  return { redirects, version: MANIFEST_VERSION }
}

const uploadManifest = async (
  client: S3Client,
  config: UploadConfig,
  entries: Redirect[],
): Promise<void> => {
  const body = JSON.stringify(buildManifest(entries))
  await client.send(
    new PutObjectCommand({
      Body: body,
      Bucket: config.s3BucketName,
      CacheControl: "max-age=600",
      ContentType: "application/json",
      Key: `${config.siteName}/${config.buildNumber}/latest/${MANIFEST_KEY_SUFFIX}`,
    }),
  )
}

const uploadOne = async (
  client: S3Client,
  config: UploadConfig,
  source: string,
  destination: string,
): Promise<void> => {
  const isPotentialFilePath = source.slice(-5).includes(".")
  const key = isPotentialFilePath ? source : `${source}/index.html`

  await client.send(
    new PutObjectCommand({
      Body: Buffer.alloc(0),
      Bucket: config.s3BucketName,
      CacheControl: "max-age=600",
      ContentLength: 0,
      ContentType: "text/html",
      Key: `${config.siteName}/${config.buildNumber}/latest/${key}`,
      Metadata: { "redirect-destination": destination },
    }),
  )
}

const runWithConcurrency = async (
  client: S3Client,
  config: UploadConfig,
  items: Redirect[],
  limit: number,
): Promise<{ failed: number }> => {
  let failed = 0
  let nextIndex = 0

  const worker = async (): Promise<void> => {
    const currentIndex = nextIndex
    nextIndex += 1

    if (currentIndex >= items.length) {
      return
    }

    const item = items[currentIndex]
    try {
      await uploadOne(client, config, item.source, item.destination)
    } catch (error) {
      console.error("Redirect upload failed:", error)
      failed += 1
    }

    await worker()
  }

  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      await worker()
    }),
  )

  return { failed }
}

const loadRedirectsFromFile = (filePath: string): Redirect[] => {
  const parsed: unknown = JSON.parse(fs.readFileSync(filePath, "utf-8"))
  return redirectsFileSchema.parse(parsed)
}

const main = async (): Promise<void> => {
  const config = resolveUploadConfig()
  if (config === null) {
    throw new Error(
      "Missing required inputs: --redirects-json, --s3-bucket-name, --site-name, --build-number (or the matching env vars)",
    )
  }

  const raw = loadRedirectsFromFile(config.redirectsJson)
  console.log(
    `Loaded ${raw.length} redirect row(s) from ${config.redirectsJson}`,
  )

  const publishable = raw.filter((redirect) => {
    if (!isSelfReferentialRedirect(redirect)) {
      return true
    }
    console.warn(
      `Skipping self-referential redirect: ${redirect.source} -> ${redirect.destination}`,
    )
    return false
  })
  const { exact: rawExact, manifestEntries } = partitionRedirects(publishable)

  const seen = new Set<string>()
  const validExact: Redirect[] = []
  for (const row of rawExact) {
    const source = normalizeSource(row.source)
    if (source === null) {
      console.warn(
        `Skipping invalid redirect source: ${JSON.stringify(row.source)}`,
      )
      continue
    }
    if (seen.has(source)) {
      console.warn(`Skipping duplicate normalised source: ${source}`)
      continue
    }
    if (!/^(?<scheme>https?:\/\/|\/)/u.test(row.destination)) {
      console.warn(
        `Destination "${row.destination}" is not absolute; browsers may interpret it inconsistently.`,
      )
    }
    seen.add(source)
    validExact.push({ destination: row.destination, source })
  }

  const client = new S3Client({})
  let totalFailed = 0

  if (validExact.length > 0) {
    console.log(
      `Uploading ${validExact.length} exact redirect(s) with concurrency ${config.concurrency}...`,
    )
    const { failed } = await runWithConcurrency(
      client,
      config,
      validExact,
      config.concurrency,
    )
    console.log(
      `Uploaded ${validExact.length - failed}/${validExact.length} exact redirects.`,
    )
    totalFailed += failed
  }

  if (manifestEntries.length > 0) {
    await uploadManifest(client, config, manifestEntries)
    console.log(`Uploaded manifest with ${manifestEntries.length} rule(s).`)
  }

  if (validExact.length === 0 && manifestEntries.length === 0) {
    console.log("No valid redirects to upload.")
    return
  }

  if (totalFailed > 0) {
    process.exit(1)
  }
}

if (argv[1] !== undefined && import.meta.url === pathToFileURL(argv[1]).href) {
  try {
    await main()
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}
