import type {
  DgsApiDatasetSearchParams,
  DgsApiDatasetSearchResponse,
  DgsApiDatasetSearchResponseSuccess,
} from "./types"
import { logDgsDebug } from "~/utils/dgs/debug"
import { generateDgsUrl } from "./generateDgsUrl"

export const fetchDataFromDgsApiDataset = async (
  params: DgsApiDatasetSearchParams,
): Promise<DgsApiDatasetSearchResponseSuccess> => {
  const url = generateDgsUrl(params)
  logDgsDebug("fetchDataFromDgsApiDataset: about to fetch datastore_search", {
    resourceId: params.resourceId,
    url,
  })

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
