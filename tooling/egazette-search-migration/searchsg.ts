import axios from "axios"
import { backOff } from "exponential-backoff"

import { env } from "./env"

const ISOMER_UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) isomer"

// Documents larger than this are rejected by SearchSG.
const MAX_BATCH = 500

export interface SearchSgDocument {
  documentId: string
  title: string
  url: string
  content?: string
  metadata?: Record<string, unknown>
}

interface CachedToken {
  value: string
  type: string
  fetchedAt: number
}

const isRetryableStatus = (status: number | undefined): boolean =>
  status === 401 || status === 429 || (status !== undefined && status >= 500)

// Exchanges the Basic API key for a short-lived bearer token. Mirrors the proven
// auth flow in tooling/site-launch/create-searchsg-client.ts.
async function fetchToken(): Promise<CachedToken> {
  const { data } = await axios.post<{ accessToken: string; tokenType: string }>(
    `${env.SEARCHSG_BASE_URL}/v1/auth/token`,
    {},
    {
      headers: {
        Authorization: `Basic ${env.SEARCHSG_API_KEY}`,
        "User-Agent": ISOMER_UA,
      },
    },
  )
  return {
    value: data.accessToken,
    type: data.tokenType,
    fetchedAt: Date.now(),
  }
}

export class SearchSgClient {
  private token: CachedToken | undefined
  // Refresh defensively well before the token's real lifetime to avoid mid-batch expiry.
  private readonly tokenTtlMs = 10 * 60 * 1000

  private async authHeader(forceRefresh = false): Promise<string> {
    const existing = this.token
    const token =
      !forceRefresh &&
      existing !== undefined &&
      Date.now() - existing.fetchedAt <= this.tokenTtlMs
        ? existing
        : await fetchToken()
    this.token = token
    return `${token.type} ${token.value}`
  }

  async upsertBatch(documents: SearchSgDocument[]): Promise<void> {
    if (documents.length === 0) return
    if (documents.length > MAX_BATCH) {
      throw new Error(
        `SearchSG accepts at most ${MAX_BATCH} documents per request, got ${documents.length}`,
      )
    }

    await backOff(
      async () => {
        const Authorization = await this.authHeader()
        try {
          // TODO(eGazette): confirm the document-ingestion endpoint and request
          // body against SearchSG's data-ingestion API docs. The auth flow above
          // is verified against site-launch; this path + payload are a best-guess
          // placeholder and are the ONLY thing that should need changing here.
          await axios.post(
            `${env.SEARCHSG_BASE_URL}/v1/applications/${env.SEARCHSG_CLIENT_ID}/documents`,
            { documents },
            {
              headers: {
                Authorization,
                "Content-Type": "application/json",
                "User-Agent": ISOMER_UA,
              },
            },
          )
        } catch (err) {
          // Force a token refresh before the next retry on auth failure.
          if (axios.isAxiosError(err) && err.response?.status === 401) {
            await this.authHeader(true)
          }
          throw err
        }
      },
      {
        numOfAttempts: env.MAX_RETRIES + 1,
        startingDelay: 1000,
        timeMultiple: 2,
        jitter: "full",
        retry: (err: unknown) =>
          axios.isAxiosError(err) && isRetryableStatus(err.response?.status),
      },
    )
  }

  // Best-effort document count used by `verify`. Endpoint must be confirmed.
  async documentCount(): Promise<number> {
    const Authorization = await this.authHeader()
    // TODO(eGazette): confirm the stats/count endpoint for an application.
    const { data } = await axios.get<{
      count?: number
      data?: { count?: number }
    }>(
      `${env.SEARCHSG_BASE_URL}/v1/applications/${env.SEARCHSG_CLIENT_ID}/documents/count`,
      { headers: { Authorization, "User-Agent": ISOMER_UA } },
    )
    const count = data.count ?? data.data?.count
    if (count === undefined) {
      throw new Error("Could not read document count from SearchSG response")
    }
    return count
  }
}
