interface FetchDgsMetadataProps {
  resourceId: string
}

interface MetaMappingType {
  // e.g. employment_rate_overall
  name: string
  // e.g. Overall Employment Rate (%)
  columnTitle: string
  // This is the ordering index (yes, this is a string not number)
  // e.g. 4 means the 5th column
  index: string
}

interface FetchDgsMetadataResponse {
  data: {
    name: string
    format: string
    datasetSize: number // in bytes
    columnMetadata: {
      metaMapping: Record<string, MetaMappingType>
    }
  }
}

export type FetchDgsMetadataOutput = Pick<
  FetchDgsMetadataResponse["data"],
  "name" | "format"
> & {
  size: FetchDgsMetadataResponse["data"]["datasetSize"]
  columnMetadata:
    | [string, string][] // 1st string is column field key, 2nd string is column title
    | undefined
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
      size: data.data.datasetSize,
      columnMetadata: extractColumnMetadata(data),
    }
  } catch (error) {
    console.error("Error fetching DGS metadata:", error)
    return undefined
  }
}

const extractColumnMetadata = (
  data: FetchDgsMetadataResponse,
): FetchDgsMetadataOutput["columnMetadata"] => {
  try {
    return Object.values(data.data.columnMetadata.metaMapping)
      .sort((a, b) => Number(a.index) - Number(b.index))
      .reduce<NonNullable<FetchDgsMetadataOutput["columnMetadata"]>>(
        (acc, mapping) => {
          acc.push([mapping.name, mapping.columnTitle])
          return acc
        },
        [],
      )
  } catch {
    return undefined
  }
}
