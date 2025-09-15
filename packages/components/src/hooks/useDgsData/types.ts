// not using "fields" to prevent runtime errors,
// as DGS returns errors for invalid fields,
// which can change unpredictably if admins update the dataset schema.
export interface DgsApiDatasetSearchParams {
  q?: string // query string
  resourceId: string
  limit?: number
  offset?: number
  // fields?: string // comma separated list of fields to fetch
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
