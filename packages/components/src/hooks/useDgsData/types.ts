export interface DgsApiDatasetSearchParams {
  resourceId: string
  offset?: number
  filters?: Record<string, string>
  sort?: string
}

export interface DgsApiDatasetSearchResponseSuccess {
  success: true
  result: {
    records: Record<string, string | number>[]
  }
}

interface DgsApiDatasetSearchResponseError {
  success: false
}

export type DgsApiDatasetSearchResponse =
  | DgsApiDatasetSearchResponseSuccess
  | DgsApiDatasetSearchResponseError
