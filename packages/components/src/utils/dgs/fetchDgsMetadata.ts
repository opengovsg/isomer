interface FetchDgsMetadataProps {
  resourceId: string
}

interface FetchDgsMetadataResponse {
  data: {
    name: string
    format: string
    datasetSize: number // in bytes
  }
}

type FetchDgsMetadataOutput = Pick<
  FetchDgsMetadataResponse["data"],
  "name" | "format"
> & {
  datasetSize: string
}

export const fetchDgsMetadata = async ({
  resourceId,
}: FetchDgsMetadataProps): Promise<FetchDgsMetadataOutput | undefined> => {
  try {
    // For simplicity sake, we will always use data.gov.sg production API
    const response = await fetch(
      `https://api-production.data.gov.sg/v2/public/api/datasets/${resourceId}/metadata`,
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = (await response.json()) as FetchDgsMetadataResponse

    return {
      name: data.data.name,
      format: data.data.format,
      datasetSize: formatBytes(data.data.datasetSize),
    }
  } catch (error) {
    console.error("Error fetching DGS metadata:", error)
    return undefined
  }
}

const formatBytes = (bytes: number): string => {
  // Handle edge cases
  if (bytes <= 0) return "0 B"

  const units = ["B", "KB", "MB", "GB", "TB"]
  const index = Math.floor(Math.log(bytes) / Math.log(1024))

  // Ensure index is within bounds
  const safeIndex = Math.min(Math.max(0, index), units.length - 1)

  const value = bytes / Math.pow(1024, safeIndex)
  return value.toFixed(2) + " " + units[safeIndex]
}
