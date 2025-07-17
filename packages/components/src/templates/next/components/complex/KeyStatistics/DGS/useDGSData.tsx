// NOTE: This hook should be shared across all DGS components

import { useEffect, useState } from "react"

import type { DGSResponse } from "~/interfaces"

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
  dgsResourceId: string
  dgsRow: {
    dgsFieldKey: string
    dgsFieldValue: string
  }
}
export const useDGSData = ({ dgsResourceId, dgsRow }: UseDGSDataProps) => {
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [data, setData] = useState<DGSResponse | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetchDataFromDGS({
          resourceId: dgsResourceId,
          filters: {
            [dgsRow.dgsFieldKey]: dgsRow.dgsFieldValue,
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
  }, [])

  return { data, isLoading, isError }
}
