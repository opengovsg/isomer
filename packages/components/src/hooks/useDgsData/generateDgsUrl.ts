import type { DgsApiDatasetSearchParams } from "./types"

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
