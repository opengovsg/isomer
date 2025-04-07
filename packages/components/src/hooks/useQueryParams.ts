import { useEffect, useState } from "react"

const getQueryParams = (params: URLSearchParams) => {
  const entries = Array.from(params.entries())
  return Object.fromEntries(entries)
}

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
    setQueryParams(getQueryParams(params))
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

    const url = new URL(window.location.pathname, window.location.origin)
    url.search = params.toString()
    const newUrl = url.toString()

    // NOTE: We do not want to add a new entry to the history stack
    window.history.replaceState({}, "", newUrl)
    setQueryParams(getQueryParams(params))
  }

  return [queryParams, updateQueryParams]
}
