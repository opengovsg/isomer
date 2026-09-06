"use client"

import { useEffect } from "react"

interface UseSearchSgScriptProps {
  pageType?: "default" | "search"
  clientId: string
  shouldLoad: boolean
}

export const useSearchSgScript = ({
  pageType = "default",
  clientId,
  shouldLoad,
}: UseSearchSgScriptProps) => {
  const SEARCHSG_CONFIG_ID = "searchsg-config"

  useEffect(() => {
    if (shouldLoad) {
      // Remove existing script if present
      const existingScriptTag = document.querySelector(`#${SEARCHSG_CONFIG_ID}`)
      if (existingScriptTag !== null) {
        existingScriptTag.remove()
      }

      // Create and append new script
      const scriptTag = document.createElement("script")
      scriptTag.id = SEARCHSG_CONFIG_ID
      const pageParam = pageType === "search" ? "&page=result" : ""
      scriptTag.src = `https://api.search.gov.sg/v1/searchconfig.js?clientId=${clientId}${pageParam}`
      scriptTag.setAttribute("defer", "")
      document.body.append(scriptTag)
    }

    return () => {
      const scriptToRemove = document.querySelector(`#${SEARCHSG_CONFIG_ID}`)
      if (scriptToRemove !== null) {
        scriptToRemove.remove()
      }
    }
  }, [clientId, shouldLoad, pageType])
}

// Backward-compatible export while consumers migrate to camelCase filename.
export const useSearchSGScript = useSearchSgScript
