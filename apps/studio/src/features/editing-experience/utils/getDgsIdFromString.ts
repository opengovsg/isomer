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
    if (parsedUrl.pathname.startsWith("/datasets/")) {
      const pathParts = parsedUrl.pathname.split("/")
      if (pathParts.length === 4 && pathParts[3] === "view" && pathParts[2]) {
        const datasetId = pathParts[2]
        if (DgsDatasetIdSchema.safeParse(datasetId).success) {
          return datasetId
        }
      }
    }

    // Ideally user don't input this format, but just in case they copy from the browser URL
    // Handle resultId parameter format: https://data.gov.sg/datasets?resultId=d_8b84c4ee58e3cfc0ece0d773c8ca6abc
    if (parsedUrl.pathname === "/datasets") {
      const resultId = parsedUrl.searchParams.get("resultId")
      if (resultId && DgsDatasetIdSchema.safeParse(resultId).success) {
        return resultId
      }
    }

    return null
  } catch {
    return null
  }
}
