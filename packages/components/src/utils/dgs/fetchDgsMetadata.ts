/* oxlint-disable typescript/no-unsafe-type-assertion -- HTTP response body matches FetchDgsMetadataResponse contract */
import { isCkanInternalColumn } from "./isCkanInternalColumn"

interface FetchDgsMetadataProps {
  resourceId: string
  signal?: AbortSignal
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
    datasetSize: number
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
    | [string, string][]
    | undefined
}

const extractColumnMetadata = (
  data: FetchDgsMetadataResponse,
): FetchDgsMetadataOutput["columnMetadata"] => {
  try {
    const sortedMappings = Object.values(data.data.columnMetadata.metaMapping)
      .filter((mapping) => !isCkanInternalColumn(mapping.name))
      .toSorted((a, b) => Number(a.index) - Number(b.index))

    const columnMetadata: NonNullable<FetchDgsMetadataOutput["columnMetadata"]> =
      []
    for (const mapping of sortedMappings) {
      columnMetadata.push([mapping.name, mapping.columnTitle])
    }
    return columnMetadata
  } catch {
    return undefined
  }
}

export const fetchDgsMetadata = async ({
  resourceId,
  signal,
}: FetchDgsMetadataProps): Promise<FetchDgsMetadataOutput> => {
  // For simplicity sake, we will always use data.gov.sg production API
  const response = await fetch(
    `https://api-production.data.gov.sg/v2/public/api/datasets/${resourceId}/metadata`,
    { signal },
  )

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }

  // SAFETY: HTTP ok response body matches FetchDgsMetadataResponse contract
  const data = (await response.json()) as FetchDgsMetadataResponse

  return {
    columnMetadata: extractColumnMetadata(data),
    format: data.data.format,
    name: data.data.name,
    size: data.data.datasetSize,
  }
}
