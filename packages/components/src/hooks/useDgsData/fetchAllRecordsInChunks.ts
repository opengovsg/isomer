import { CKAN_ROW_ID_COLUMN, DGS_REQUEST_MAX_BYTES } from "~/utils/dgs"

import type {
  DgsApiDatasetSearchParams,
  DgsApiDatasetSearchResponseSuccess,
} from "./types"
import { fetchDataFromDgsApiDataset } from "./fetchDataFromDgsApi"

const RETRY_DELAYS_MS = [300, 800]

const delay = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms))

const fetchWithRetry = async (
  params: DgsApiDatasetSearchParams,
): Promise<DgsApiDatasetSearchResponseSuccess> => {
  let lastError: unknown
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      return await fetchDataFromDgsApiDataset(params)
    } catch (err) {
      lastError = err
      const nextDelay = RETRY_DELAYS_MS[attempt]
      if (nextDelay !== undefined) {
        await delay(nextDelay)
      }
    }
  }
  throw lastError
}

interface FetchAllRecordsInChunksParams {
  resourceId: string
  datasetSize: number
  filters?: Record<string, string>
  sort?: string
}

export const fetchAllRecordsInChunks = async ({
  resourceId,
  datasetSize,
  filters,
  sort,
}: FetchAllRecordsInChunksParams): Promise<{
  records: DgsApiDatasetSearchResponseSuccess["result"]["records"]
  total: number
}> => {
  const baseParams: DgsApiDatasetSearchParams = {
    resourceId,
    filters,
    sort: sort ?? CKAN_ROW_ID_COLUMN,
  }

  const probeResponse = await fetchWithRetry({ ...baseParams, limit: 1 })
  const total = probeResponse.result.total

  if (total === 0) {
    return { records: [], total: 0 }
  }

  const baseChunks = Math.max(1, Math.ceil(datasetSize / DGS_REQUEST_MAX_BYTES))
  // +1 buffer when multi-chunk: rows are not evenly distributed across the
  // dataset's byte size, so the last chunk may exceed the per-chunk row estimate.
  const numChunks = baseChunks > 1 ? baseChunks + 1 : baseChunks
  const limitPerChunk = Math.ceil(total / numChunks)

  const chunkResponses = await Promise.all(
    Array.from({ length: numChunks }, (_, i) =>
      fetchWithRetry({
        ...baseParams,
        limit: limitPerChunk,
        offset: i * limitPerChunk,
      }),
    ),
  )

  const records = chunkResponses.flatMap((r) => r.result.records)
  return { records, total }
}
