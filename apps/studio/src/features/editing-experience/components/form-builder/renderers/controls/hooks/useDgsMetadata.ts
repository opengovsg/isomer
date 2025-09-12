import { useQuery } from "@tanstack/react-query"
import { useDebounce } from "@uidotdev/usehooks"

interface UseDgsMetadataProps {
  datasetId: string | null
}
export const useDgsMetadata = ({ datasetId }: UseDgsMetadataProps) => {
  const debouncedDatasetId = useDebounce(datasetId, 300)

  return useQuery<boolean, Error>({
    queryKey: ["dgs-metadata", debouncedDatasetId],
    queryFn: async () => {
      if (!debouncedDatasetId) return false

      const metadata = await fetchDgsMetadata({
        resourceId: debouncedDatasetId,
      })

      return Boolean(metadata && metadata.format === "CSV")
    },
    enabled: !!debouncedDatasetId,
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
