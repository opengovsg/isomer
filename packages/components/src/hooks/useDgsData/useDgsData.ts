"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

import type {
  DgsApiDatasetSearchParams,
  DgsApiDatasetSearchResponseSuccess,
} from "./types"
import { fetchDataFromDgsApiDataset } from "./fetchDataFromDgsApi"

interface UseDgsData extends DgsApiDatasetSearchParams {
  fetchAll?: boolean
}

export const useDgsData = ({
  fetchAll = false,
  resourceId,
  limit,
  offset,
  filters,
  sort,
}: UseDgsData) => {
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [data, setData] = useState<DgsApiDatasetSearchResponseSuccess | null>(
    null,
  )

  // Required because we don't want to deconstruct the params in the props,
  // which will cause infinite re-renders for the subsequent useCallback hooks.
  const memoizedParams = useMemo(
    () => ({
      resourceId,
      limit,
      offset,
      filters,
      sort,
    }),
    [resourceId, limit, offset, filters, sort],
  )

  const fetchAllRecords = useCallback(async () => {
    // arbitrary large number to fetch all records
    const fetchAllLimit = 10000

    // 1st API call to attempt to fetch all records
    const initialResponse = await fetchDataFromDgsApiDataset({
      ...memoizedParams,
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
      ...memoizedParams,
      limit: numberOfRecords,
    })

    setData(allRecordsResponse)
  }, [memoizedParams])

  const fetchRecords = useCallback(async () => {
    const response = await fetchDataFromDgsApiDataset(memoizedParams)
    setData(response)
  }, [memoizedParams])

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        if (fetchAll) {
          await fetchAllRecords()
        } else {
          await fetchRecords()
        }
        setIsError(false)
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
