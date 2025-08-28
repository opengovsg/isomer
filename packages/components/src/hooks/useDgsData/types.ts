export interface DgsApiDatasetSearchParams {
  resourceId: string
  limit?: number
  offset?: number
  fields?: string // comma separated list of fields to fetch
  filters?: Record<string, string>
  sort?: string
}

export interface DgsApiDatasetSearchResponseSuccess {
  success: true
  result: {
    records: Record<string, string | number>[]
    total: number
  }
}

interface DgsApiDatasetSearchResponseError {
  success: false
}

export type DgsApiDatasetSearchResponse =
  | DgsApiDatasetSearchResponseSuccess
  | DgsApiDatasetSearchResponseError
