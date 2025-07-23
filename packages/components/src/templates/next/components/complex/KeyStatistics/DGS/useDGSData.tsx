// NOTE: This hook should be shared across all DGS components

import { useEffect, useState } from "react"

import type { DGSResponse, DGSSuccessResponse } from "~/interfaces"

const BASE_URL = "https://data.gov.sg/api/action/datastore_search"

interface FetchDataFromDGSProps {
  resourceId: string
  filters: Record<string, string>
}
export const fetchDataFromDGS = async ({
  resourceId,
  filters,
}: FetchDataFromDGSProps) => {
  const params = new URLSearchParams({
    resource_id: resourceId,
  })

  if (Object.keys(filters).length > 0) {
    params.set("filters", JSON.stringify(filters))
  }

  const url = `${BASE_URL}?${params.toString()}`

  const res = await fetch(url)

  return res.json() as Promise<DGSResponse>
}

interface UseDGSDataProps {
  resourceId: string
  row: {
    fieldKey: string
    fieldValue: string
  }
}
interface UseDGSDataReturn {
  record: DGSSuccessResponse["result"]["records"][0] | undefined
  isLoading: boolean
  isError: boolean
}
export const useDGSData = ({
  resourceId,
  row,
}: UseDGSDataProps): UseDGSDataReturn => {
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [data, setData] = useState<DGSResponse | null>(null)

  useEffect(() => {
    // Note: we can add better error handling here - skipping now as this is a POC
    async function fetchData() {
      try {
        const response = await fetchDataFromDGS({
          resourceId,
          filters: {
            [row.fieldKey]: row.fieldValue,
          },
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
  }, [resourceId, row.fieldKey, row.fieldValue])

  // Assumption: we only have one row. If more than one, we will choose the first one
  const record = data?.success ? data.result.records[0] : undefined

  return { record, isLoading, isError }
}
