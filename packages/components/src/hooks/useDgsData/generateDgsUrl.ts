import type { DgsApiDatasetSearchParams } from "./types"

export const generateDgsUrl = ({
  resourceId,
  q,
  limit,
  offset,
  filters,
  sort,
}: DgsApiDatasetSearchParams) => {
  const url = new URL("https://data.gov.sg/api/action/datastore_search")

  // Set the required resource_id parameter
  url.searchParams.set("resource_id", resourceId)

  if (q !== undefined && q !== "") {
    url.searchParams.set("q", q)
  }

  // Set optional parameters if they exist
  if (limit !== undefined && limit !== 0) {
    url.searchParams.set("limit", limit.toString())
  }

  if (offset !== undefined && offset !== 0) {
    url.searchParams.set("offset", offset.toString())
  }

  if (filters !== undefined && Object.keys(filters).length > 0) {
    url.searchParams.set("filters", JSON.stringify(filters))
  }

  if (sort !== undefined && sort !== "") {
    url.searchParams.set("sort", sort)
  }

  return url.toString()
}
