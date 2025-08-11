import { useCallback, useEffect, useState } from "react"

import type {
  DgsApiDatasetSearchParams,
  DgsApiDatasetSearchResponseSuccess,
} from "./types"
import { fetchDataFromDgsApiDataset } from "./fetchDataFromDgsApi"

interface UseDgsDataParams extends DgsApiDatasetSearchParams {
  fetchAll?: boolean
}

export const useDgsData = ({
  fetchAll = false,
  ...params
}: UseDgsDataParams) => {
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [data, setData] = useState<DgsApiDatasetSearchResponseSuccess | null>(
    null,
  )

  const fetchAllRecords = useCallback(async () => {
    // arbitrary large number to fetch all records
    const fetchAllLimit = 10000

    // 1st API call to attempt to fetch all records
    const initialResponse = await fetchDataFromDgsApiDataset({
      ...params,
      limit: fetchAllLimit,
    })

    const numberOfRecords = initialResponse.result.total

    // If total records are within fetchAllLimit,
    // use the initial response and skip a second API call.
    if (numberOfRecords <= fetchAllLimit) {
      setData(initialResponse)
      return
    }

    // 2nd API call to fetch all records
    // using the total number of records returned by the initial API call
    // We are risk-accepting that:
    // 1. The total number of records is accurate
    // 2. The total number of records is not too large
    const allRecordsResponse = await fetchDataFromDgsApiDataset({
      ...params,
      limit: numberOfRecords,
    })

    setData(allRecordsResponse)
  }, [params])

  const fetchRecords = useCallback(async () => {
    const response = await fetchDataFromDgsApiDataset(params)
    setData(response)
  }, [params])

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (fetchAll) {
          await fetchAllRecords()
        } else {
          await fetchRecords()
        }
      } catch {
        setIsError(true)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchData()
  }, [fetchAll, fetchAllRecords, fetchRecords])

  return {
    records: data?.result.records,
    isLoading,
    isError,
  }
}
