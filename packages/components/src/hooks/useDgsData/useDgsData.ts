import { useEffect, useState } from "react"

import type { DgsApiDatasetSearchResponseSuccess } from "./types"
import { fetchDataFromDgsApiDataset } from "./fetchDataFromDgsApi"

export interface UseDGSDataProps {
  resourceId: string
  row: {
    fieldKey: string
    fieldValue: string
  }
}

export const useDgsData = ({ resourceId, row }: UseDGSDataProps) => {
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [data, setData] = useState<DgsApiDatasetSearchResponseSuccess | null>(
    null,
  )

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetchDataFromDgsApiDataset({
          resourceId,
          filters: {
            [row.fieldKey]: row.fieldValue,
          },
        })
        setData(response)
      } catch {
        setIsError(true)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchData()
  }, [resourceId, row.fieldKey, row.fieldValue])

  // Assumption: we only have one row. If more than one, we will choose the first one
  const record = data?.result.records[0]

  return { record, isLoading, isError }
}
