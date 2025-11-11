// Reference: https://guide.data.gov.sg/developer-guide/dataset-apis/search-and-filter-within-dataset
// NOTE: not using "fields" to prevent runtime errors,
// as DGS returns errors for invalid fields,
// which can change unpredictably if admins update the dataset schema.
export interface DgsApiDatasetSearchParams {
  resourceId: string
  q?: string // query string
  limit?: number
  offset?: number
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
