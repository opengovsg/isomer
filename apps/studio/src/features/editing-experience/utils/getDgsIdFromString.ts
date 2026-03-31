// DGS Dataset ID utilities for studio form builder
import { z } from "zod"

const DgsDatasetIdSchema = z.string().regex(/^d_[a-zA-Z0-9]+$/, {
  message:
    "DGS dataset ID must start with 'd_' followed by alphanumeric characters",
})

interface GetDgsIdFromStringProps {
  string: string
}

export const getDgsIdFromString = ({
  string,
}: GetDgsIdFromStringProps): string | null => {
  try {
    // Handle direct ID format: d_abc123
    if (DgsDatasetIdSchema.safeParse(string).success) {
      return string
    }

    // Try to parse as URL
    const parsedUrl = new URL(string)
    if (parsedUrl.hostname !== "data.gov.sg") {
      return null
    }

    // Handle full URL format: https://data.gov.sg/datasets/d_abc123/view
    const viewUrlResult = extractDatasetIdFromViewUrl(parsedUrl)
    if (viewUrlResult) return viewUrlResult

    // Ideally user don't input this format, but just in case they copy from the browser URL
    // Handle resultId parameter format: https://data.gov.sg/datasets?resultId=d_8b84c4ee58e3cfc0ece0d773c8ca6abc
    const resultIdResult = extractDatasetIdFromResultId(parsedUrl)
    if (resultIdResult) return resultIdResult

    return null
  } catch {
    return null
  }
}

const extractDatasetIdFromViewUrl = (parsedUrl: URL): string | null => {
  if (!parsedUrl.pathname.startsWith("/datasets/")) {
    return null
  }

  const pathParts = parsedUrl.pathname.split("/")
  if (pathParts.length !== 4 || pathParts[3] !== "view" || !pathParts[2]) {
    return null
  }

  const datasetId = pathParts[2]
  if (!DgsDatasetIdSchema.safeParse(datasetId).success) {
    return null
  }

  return datasetId
}

const extractDatasetIdFromResultId = (parsedUrl: URL): string | null => {
  if (parsedUrl.pathname !== "/datasets") {
    return null
  }

  const resultId = parsedUrl.searchParams.get("resultId")
  if (!resultId || !DgsDatasetIdSchema.safeParse(resultId).success) {
    return null
  }

  return resultId
}
