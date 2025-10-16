import type { DgsApiDatasetSearchParams } from "./types"

export const generateDgsUrl = ({
  resourceId,
  limit,
  offset,
  filters,
  sort,
}: DgsApiDatasetSearchParams) => {
  const url = new URL("https://data.gov.sg/api/action/datastore_search")

  // Set the required resource_id parameter
  url.searchParams.set("resource_id", resourceId)

  // Set optional parameters if they exist
  if (limit) {
    url.searchParams.set("limit", limit.toString())
  }

  if (offset) {
    url.searchParams.set("offset", offset.toString())
  }

  if (filters && Object.keys(filters).length > 0) {
    url.searchParams.set("filters", JSON.stringify(filters))
  }

  if (sort) {
    url.searchParams.set("sort", sort)
  }

  return url.toString()
}
