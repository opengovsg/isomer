import type {
  DgsApiDatasetSearchParams,
  DgsApiDatasetSearchResponse,
  DgsApiDatasetSearchResponseSuccess,
} from "./types"

export const fetchDataFromDgsApiDataset = async ({
  resourceId,
  offset: _offset, // not in used for now
  filters,
  sort: _sort, // not in used for now
}: DgsApiDatasetSearchParams): Promise<DgsApiDatasetSearchResponseSuccess> => {
  const params = new URLSearchParams({
    resource_id: resourceId,
  })

  if (filters && Object.keys(filters).length > 0) {
    params.set("filters", JSON.stringify(filters))
  }

  const url = `https://data.gov.sg/api/action/datastore_search?${params.toString()}`

  const res = await fetch(url)

  if (!res.ok) {
    throw new Error("Failed to fetch data from DGS API")
  }

  const data = (await res.json()) as DgsApiDatasetSearchResponse

  // Safety check:
  // Already handled by status code, but checking the response "success" field to be safe
  if (data.success === "false") {
    throw new Error("Failed to fetch data from DGS API")
  }

  return data
}
