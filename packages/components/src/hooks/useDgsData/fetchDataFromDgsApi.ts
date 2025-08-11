import type {
  DgsApiDatasetSearchParams,
  DgsApiDatasetSearchResponse,
  DgsApiDatasetSearchResponseSuccess,
} from "./types"

export const fetchDataFromDgsApiDataset = async (
  params: DgsApiDatasetSearchParams,
): Promise<DgsApiDatasetSearchResponseSuccess> => {
  const url = generateDgsUrl(params)
  const res = await fetch(url)

  if (!res.ok) {
    throw new Error("Failed to fetch data from DGS API")
  }

  const data = (await res.json()) as DgsApiDatasetSearchResponse

  // Safety check:
  // Already handled by status code, but checking the response "success" field to be safe
  if (!data.success) {
    throw new Error("Failed to fetch data from DGS API")
  }

  return data
}

export const generateDgsUrl = ({
  resourceId,
  limit,
  offset,
  fields,
  filters,
  sort,
}: DgsApiDatasetSearchParams) => {
  const params = new URLSearchParams({
    resource_id: resourceId,
  })

  if (limit) {
    params.set("limit", limit.toString())
  }

  if (offset) {
    params.set("offset", offset.toString())
  }

  if (fields) {
    params.set("fields", fields)
  }

  if (filters && Object.keys(filters).length > 0) {
    params.set("filters", JSON.stringify(filters))
  }

  if (sort) {
    params.set("sort", sort)
  }

  return `https://data.gov.sg/api/action/datastore_search?${params.toString()}`
}
