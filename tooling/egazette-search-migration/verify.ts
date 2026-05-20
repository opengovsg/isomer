import { createReadStream } from "node:fs"
import { createInterface } from "node:readline"

import { env } from "./env"
import { SearchSgClient } from "./searchsg"
import { toSearchSgDocument, type AlgoliaGazetteRecord } from "./transform"

interface SourceCounts {
  rawLines: number
  uniqueDocumentIds: number
}

// Counts source records and the number of distinct documentIds. Because ingestion
// upserts by documentId, the unique count is what SearchSG should end up holding.
async function countSource(): Promise<SourceCounts> {
  const rl = createInterface({
    input: createReadStream(env.DOCUMENTS_FILE),
    crlfDelay: Infinity,
  })

  const ids = new Set<string>()
  let rawLines = 0
  for await (const rawLine of rl) {
    const line = rawLine.trim()
    if (line.length === 0) continue
    rawLines++
    try {
      const record = JSON.parse(line) as AlgoliaGazetteRecord
      ids.add(toSearchSgDocument(record).documentId)
    } catch {
      console.error(`Skipping malformed JSON while counting (line ${rawLines})`)
    }
  }
  return { rawLines, uniqueDocumentIds: ids.size }
}

export async function verify(): Promise<void> {
  const source = await countSource()
  console.log(`Source raw lines:          ${source.rawLines}`)
  console.log(`Source unique documentIds: ${source.uniqueDocumentIds}`)
  if (source.rawLines !== source.uniqueDocumentIds) {
    console.warn(
      `Note: ${source.rawLines - source.uniqueDocumentIds} duplicate documentIds ` +
        `in source - these collapse to a single document on upsert.`,
    )
  }

  try {
    const remote = await new SearchSgClient().documentCount()
    console.log(`SearchSG document count:   ${remote}`)
    if (remote === source.uniqueDocumentIds) {
      console.log("PARITY OK")
    } else {
      console.error(
        `MISMATCH: expected ${source.uniqueDocumentIds}, SearchSG reports ${remote}`,
      )
      process.exitCode = 1
    }
  } catch (err) {
    console.error(
      `Could not fetch SearchSG document count (confirm the count endpoint): ${String(err)}`,
    )
    process.exitCode = 1
  }
}
