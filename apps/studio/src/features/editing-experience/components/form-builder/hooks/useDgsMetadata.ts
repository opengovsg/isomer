import { useQuery } from "@tanstack/react-query"

interface UseDgsMetadataProps {
  datasetId: string | null
}
export const useDgsMetadata = ({ datasetId }: UseDgsMetadataProps) => {
  return useQuery<string | undefined, Error>({
    queryKey: ["dgs-metadata", datasetId],
    queryFn: async () => {
      if (!datasetId) return undefined

      const metadata = await fetchDgsMetadata({
        resourceId: datasetId,
      })

      return metadata?.format
    },
    enabled: !!datasetId,
  })
}

interface FetchDgsMetadataProps {
  resourceId: string
}
interface FetchDgsMetadataOutput {
  format: string
  name?: string
}
const fetchDgsMetadata = async ({
  resourceId,
}: FetchDgsMetadataProps): Promise<FetchDgsMetadataOutput | undefined> => {
  try {
    const response = await fetch(
      `https://api-production.data.gov.sg/v2/public/api/datasets/${resourceId}/metadata`,
    )

    if (!response.ok) {
      return undefined
    }

    const result = (await response.json()) as {
      data: {
        format: string
      }
    }

    return {
      format: result.data.format,
    }
  } catch {
    return undefined
  }
}
