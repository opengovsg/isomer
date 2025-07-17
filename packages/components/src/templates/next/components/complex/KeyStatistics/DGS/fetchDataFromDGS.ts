import type { DGSResponse } from "~/interfaces"

const BASE_URL = "https://data.gov.sg/api/action/datastore_search"

// TODO: to move to somewhere else as shared function
// there are more params to add but we don't need them (for now)
interface FetchDataFromDGSProps {
  resourceId: string
  filters: Record<string, string>
  limit?: number
}
export const fetchDataFromDGS = async ({
  resourceId,
  filters,
  limit,
}: FetchDataFromDGSProps) => {
  const params = new URLSearchParams({
    resource_id: resourceId,
  })

  if (Object.keys(filters).length > 0) {
    params.set("filters", JSON.stringify(filters))
  }

  if (limit !== undefined) {
    params.set("limit", limit.toString())
  }

  const url = `${BASE_URL}?${params.toString()}`

  const res = await fetch(url)

  return res.json() as Promise<DGSResponse>
}
