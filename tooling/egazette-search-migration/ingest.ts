import { createReadStream } from "node:fs"
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname } from "node:path"
import { createInterface } from "node:readline"

import { env } from "./env"
import { SearchSgClient, type SearchSgDocument } from "./searchsg"
import { toSearchSgDocument, type AlgoliaGazetteRecord } from "./transform"

interface Checkpoint {
  processedLines: number
  ingested: number
  failed: number
}

async function readCheckpoint(): Promise<Checkpoint> {
  try {
    const raw = await readFile(env.CHECKPOINT_FILE, "utf8")
    return JSON.parse(raw) as Checkpoint
  } catch {
    return { processedLines: 0, ingested: 0, failed: 0 }
  }
}

async function writeCheckpoint(cp: Checkpoint): Promise<void> {
  await mkdir(dirname(env.CHECKPOINT_FILE), { recursive: true })
  await writeFile(env.CHECKPOINT_FILE, JSON.stringify(cp, null, 2))
}

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms))

export async function ingest(): Promise<void> {
  const client = new SearchSgClient()
  const cp = await readCheckpoint()
  const minIntervalMs = 1000 / env.MAX_REQUESTS_PER_SECOND

  if (cp.processedLines > 0) {
    console.log(
      `Resuming from checkpoint: ${cp.processedLines} lines already processed ` +
        `(ingested=${cp.ingested}, failed=${cp.failed}).`,
    )
  }
  if (env.DRY_RUN) console.log("DRY_RUN=true - no documents will be sent.")

  const rl = createInterface({
    input: createReadStream(env.DOCUMENTS_FILE),
    crlfDelay: Infinity,
  })

  let lineNo = 0
  let batch: SearchSgDocument[] = []
  let batchStartLine = 0

  const flush = async (): Promise<void> => {
    if (batch.length === 0) return
    const startedAt = Date.now()
    try {
      if (!env.DRY_RUN) await client.upsertBatch(batch)
      cp.ingested += batch.length
      console.log(
        `Upserted ${batch.length} docs (lines ${batchStartLine}-${lineNo}); total ingested=${cp.ingested}`,
      )
    } catch (err) {
      cp.failed += batch.length
      await mkdir(dirname(env.DEADLETTER_FILE), { recursive: true })
      await appendFile(
        env.DEADLETTER_FILE,
        batch.map((d) => JSON.stringify(d)).join("\n") + "\n",
      )
      console.error(
        `Batch (lines ${batchStartLine}-${lineNo}) failed after retries; ` +
          `${batch.length} docs written to ${env.DEADLETTER_FILE}. ${String(err)}`,
      )
    }
    cp.processedLines = lineNo
    await writeCheckpoint(cp)
    batch = []

    // Throttle so we stay under MAX_REQUESTS_PER_SECOND.
    const elapsed = Date.now() - startedAt
    if (elapsed < minIntervalMs) await sleep(minIntervalMs - elapsed)
  }

  for await (const rawLine of rl) {
    lineNo++
    if (lineNo <= cp.processedLines) continue // already done on a previous run
    const line = rawLine.trim()
    if (line.length === 0) continue

    let record: AlgoliaGazetteRecord
    try {
      record = JSON.parse(line) as AlgoliaGazetteRecord
    } catch {
      console.error(`Skipping malformed JSON at line ${lineNo}`)
      continue
    }

    if (batch.length === 0) batchStartLine = lineNo
    batch.push(toSearchSgDocument(record))
    if (batch.length >= env.BATCH_SIZE) await flush()
  }
  await flush()

  console.log(
    `Done. ingested=${cp.ingested} failed=${cp.failed} processedLines=${cp.processedLines}`,
  )
  if (cp.failed > 0) {
    console.error(
      `${cp.failed} documents failed - inspect ${env.DEADLETTER_FILE}. ` +
        `To retry only failures: set DOCUMENTS_FILE to the dead-letter file, ` +
        `use a fresh CHECKPOINT_FILE, and re-run \`ingest\`.`,
    )
    process.exitCode = 1
  }
}
