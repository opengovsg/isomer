import { useEffect, useState } from "react"

import type {
  DgsApiDatasetSearchParams,
  DgsApiDatasetSearchResponseSuccess,
} from "./types"
import { fetchDataFromDgsApiDataset } from "./fetchDataFromDgsApi"

export const useDgsData = (params: DgsApiDatasetSearchParams) => {
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [data, setData] = useState<DgsApiDatasetSearchResponseSuccess | null>(
    null,
  )

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetchDataFromDgsApiDataset(params)
        setData(response)
      } catch {
        setIsError(true)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchData()
  }, [params])

  return {
    records: data?.result.records,
    isLoading,
    isError,
  }
}
