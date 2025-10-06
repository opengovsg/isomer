import { formatBytes } from "../formatBytes"

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
  size: string | undefined
}

export const fetchDgsMetadata = async ({
  resourceId,
}: FetchDgsMetadataProps): Promise<FetchDgsMetadataOutput | undefined> => {
  try {
    // For simplicity sake, we will always use data.gov.sg production API
    const response = await fetch(
      `https://api-staging.data.gov.sg/v2/public/api/datasets/${resourceId}/metadata`,
    )

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = (await response.json()) as FetchDgsMetadataResponse

    return {
      name: data.data.name,
      format: data.data.format,
      size: formatBytes(data.data.datasetSize),
    }
  } catch (error) {
    console.error("Error fetching DGS metadata:", error)
    return undefined
  }
}
