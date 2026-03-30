import { useEffect, useState } from "react"

const getQueryParams = (params: URLSearchParams) => {
  const entries = Array.from(params.entries())
  return Object.fromEntries(entries)
}

interface UpdateQueryParams {
  newParams: Record<string, string | undefined>
}

// A hook to manage a page's query params without adding new entries to the
// history stack
export const useQueryParams = (): [
  Record<string, string>,
  (params: UpdateQueryParams) => void,
] => {
  const [queryParams, setQueryParams] = useState<Record<string, string>>({})

  useEffect(() => {
    const handleUrlChange = () => {
      const params = new URLSearchParams(window.location.search)
      setQueryParams(getQueryParams(params))
    }

    // pushState (used by Next.js Link) doesn't fire popstate, so we patch it
    // to dispatch a custom event
    const originalPushState = window.history.pushState.bind(window.history)
    window.history.pushState = (...args) => {
      originalPushState(...args)
      window.dispatchEvent(new Event("pushstate"))
    }

    handleUrlChange()
    window.addEventListener("popstate", handleUrlChange)
    window.addEventListener("pushstate", handleUrlChange)
    return () => {
      window.removeEventListener("popstate", handleUrlChange)
      window.removeEventListener("pushstate", handleUrlChange)
      window.history.pushState = originalPushState
    }
  }, [])

  const updateQueryParams = ({ newParams }: UpdateQueryParams) => {
    const params = new URLSearchParams(queryParams)
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
