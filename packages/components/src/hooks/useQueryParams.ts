import { useEffect, useState } from "react"

interface UpdateQueryParams {
  oldParams: Record<string, string>
  newParams: Record<string, string | undefined>
}

// A hook to manage a page's query params without adding new entries to the
// history stack
export const useQueryParams = (): [
  Record<string, string>,
  (params: UpdateQueryParams) => void,
] => {
  const [queryParams, setQueryParams] = useState({})

  // Parse initial query params from the URL when component mounts
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const entries = Array.from(params.entries())
    setQueryParams(Object.fromEntries(entries))
  }, [])

  const updateQueryParams = ({ oldParams, newParams }: UpdateQueryParams) => {
    const params = new URLSearchParams(oldParams)
    for (const key in newParams) {
      if (newParams[key] == undefined || newParams[key] === "") {
        params.delete(key)
      } else {
        params.set(key, newParams[key])
      }
    }

    const newUrl = window.location.pathname + "?" + params.toString()
    // NOTE: We do not want to add a new entry to the history stack
    window.history.replaceState({}, "", newUrl)

    setQueryParams(Object.fromEntries(Array.from(params.entries())))
  }

  return [queryParams, updateQueryParams]
}
