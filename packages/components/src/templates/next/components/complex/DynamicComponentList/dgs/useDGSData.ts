// NOTE: This hook should be shared across all DGS components

import { useEffect, useState } from "react"

import type { DGSResponse, DGSSuccessResponse } from "./types"

const BASE_URL =
  "https://api-public-staging.data.gov.sg/api/action/datastore_search"

interface FetchDataFromDGSProps {
  resourceId: string
}
export const fetchDataFromDGS = async ({
  resourceId,
}: FetchDataFromDGSProps) => {
  const params = new URLSearchParams({
    resource_id: resourceId,
  })

  const url = `${BASE_URL}?${params.toString()}`

  const res = await fetch(url)

  return res.json() as Promise<DGSResponse>
}

interface UseDGSDataProps {
  dgsResourceId: string
}
export interface UseDGSDataReturn {
  rows: DGSSuccessResponse["result"]["records"] | undefined
  isLoading: boolean
  isError: boolean
}
export const useDGSData = ({
  dgsResourceId,
}: UseDGSDataProps): UseDGSDataReturn => {
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [data, setData] = useState<DGSResponse | null>(null)

  useEffect(() => {
    // Note: we can add better error handling here - skipping now as this is a POC
    async function fetchData() {
      try {
        const response = await fetchDataFromDGS({
          resourceId: dgsResourceId,
        })
        if (response.success) {
          setData(response)
        } else {
          setIsError(true)
        }
      } catch {
        setIsError(true)
      } finally {
        setIsLoading(false)
      }
    }

    void fetchData()
  }, [dgsResourceId])

  const rows = data?.success ? data.result.records : undefined

  return { rows, isLoading, isError }
}
