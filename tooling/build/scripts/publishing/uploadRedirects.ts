import { spawn } from "child_process"
import * as fs from "fs"
import * as os from "os"
import * as path from "path"

const REDIRECTS_JSON = process.env.REDIRECTS_JSON
const S3_BUCKET = process.env.S3_BUCKET_NAME
const SITE_NAME = process.env.SITE_NAME
const BUILD_NUMBER = process.env.CODEBUILD_BUILD_NUMBER
const CONCURRENCY = Number(process.env.UPLOAD_CONCURRENCY) || 20

interface Redirect {
  source: string
  destination: string
}

// Returns the normalised S3 key segment, or null if the source is unsafe/empty.
function normalizeSource(source: string): string | null {
  if (typeof source !== "string") return null
  // Reject control chars and backslashes
  if (/[\x00-\x1f\\]/.test(source)) return null
  const trimmed = source
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\/+/g, "/")
  if (!trimmed) return null
  // Reject any path-traversal segment
  if (trimmed.split("/").some((seg) => seg === "..")) return null
  return trimmed
}

const EMPTY_FILE = path.join(os.tmpdir(), "isomer-redirect-empty")

function uploadOne(source: string, destination: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn("aws", [
      "s3",
      "cp",
      "--only-show-errors",
      EMPTY_FILE,
      `s3://${S3_BUCKET}/${SITE_NAME}/${BUILD_NUMBER}/latest/${source}/index.html`,
      "--content-type",
      "text/html",
      "--cache-control",
      "max-age=600",
      // JSON form avoids shorthand parsing of commas/equals in destination URLs.
      "--metadata",
      JSON.stringify({ "redirect-destination": destination }),
    ])
    let stderr = ""
    proc.stderr.on("data", (d) => {
      stderr += d.toString()
    })
    proc.on("close", (code) => {
      if (code === 0) resolve()
      else
        reject(
          new Error(`aws s3 cp exited ${code} for ${source}: ${stderr.trim()}`),
        )
    })
    proc.on("error", reject)
  })
}

// Worker-pool: each worker pulls from the shared queue until it is empty.
async function runWithConcurrency(
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
        await uploadOne(r.source, r.destination)
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

  fs.writeFileSync(EMPTY_FILE, "")

  console.log(
    `Uploading ${valid.length} redirect(s) with concurrency ${CONCURRENCY}...`,
  )
  const { failed } = await runWithConcurrency(valid, CONCURRENCY)
  console.log(`Uploaded ${valid.length - failed}/${valid.length} redirects.`)
  if (failed > 0) process.exit(1)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
