// DGS Dataset ID utilities for studio form builder
import { z } from "zod"
import {
  hasNonEmptyString,
  isDefinedNumber,
  isNullableBooleanTrue,
  isNonEmptyArray,
} from "~/utils/truthiness"

const DgsDatasetIdSchema = z.string().regex(/^d_[a-zA-Z0-9]+$/u, {
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
    // oxlint-disable-next-line eslint/no-use-before-define -- core cleanup deferred
    const viewUrlResult = extractDatasetIdFromViewUrl(parsedUrl)
    if (hasNonEmptyString(viewUrlResult)) {
      return viewUrlResult
    }

    // Ideally user don't input this format, but just in case they copy from the browser URL
    // Handle resultId parameter format: https://data.gov.sg/datasets?resultId=d_8b84c4ee58e3cfc0ece0d773c8ca6abc
    // oxlint-disable-next-line eslint/no-use-before-define -- core cleanup deferred
    const resultIdResult = extractDatasetIdFromResultId(parsedUrl)
    if (hasNonEmptyString(resultIdResult)) {
      return resultIdResult
    }

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
  if (
    pathParts.length !== 4 ||
    pathParts[3] !== "view" ||
    !hasNonEmptyString(pathParts[2])
  ) {
    return null
  }

  // oxlint-disable-next-line eslint/prefer-destructuring -- core cleanup deferred
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
  if (
    !hasNonEmptyString(resultId) ||
    !DgsDatasetIdSchema.safeParse(resultId).success
  ) {
    return null
  }

  return resultId
}
