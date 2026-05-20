import axios from "axios"
import { backOff } from "exponential-backoff"
import { appendFile, mkdir, writeFile } from "node:fs/promises"
import { dirname } from "node:path"

import { env } from "./env"

interface BrowseResponse {
  hits?: unknown[]
  cursor?: string
}

// Streams every record out of the Algolia index into the NDJSON documents file
// using the cursor-based `browse` endpoint (no 1000-hit pagination cap).
export async function exportAlgolia(): Promise<void> {
  const appId = env.ALGOLIA_APP_ID
  const apiKey = env.ALGOLIA_API_KEY
  const index = env.ALGOLIA_INDEX_NAME
  if (!appId || !apiKey || !index) {
    throw new Error(
      "ALGOLIA_APP_ID, ALGOLIA_API_KEY and ALGOLIA_INDEX_NAME are required for `export`",
    )
  }

  const url = `https://${appId}-dsn.algolia.net/1/indexes/${encodeURIComponent(index)}/browse`
  const headers = {
    "X-Algolia-API-Key": apiKey,
    "X-Algolia-Application-Id": appId,
    "Content-Type": "application/json",
  }

  await mkdir(dirname(env.DOCUMENTS_FILE), { recursive: true })
  await writeFile(env.DOCUMENTS_FILE, "") // truncate any previous export

  let cursor: string | undefined
  let total = 0
  do {
    const { data } = await backOff(
      () =>
        axios.post<BrowseResponse>(url, cursor ? { cursor } : {}, { headers }),
      {
        numOfAttempts: env.MAX_RETRIES + 1,
        startingDelay: 1000,
        timeMultiple: 2,
        jitter: "full",
      },
    )
    const hits = data.hits ?? []
    if (hits.length > 0) {
      await appendFile(
        env.DOCUMENTS_FILE,
        hits.map((h) => JSON.stringify(h)).join("\n") + "\n",
      )
      total += hits.length
    }
    cursor = data.cursor
    console.log(`Exported ${total} records...`)
  } while (cursor)

  console.log(
    `Export complete: ${total} records written to ${env.DOCUMENTS_FILE}`,
  )
}
