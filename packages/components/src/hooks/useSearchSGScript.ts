"use client"

import { useEffect } from "react"

interface UseSearchSGScriptProps {
  pageType?: "default" | "search"
  clientId: string
  shouldLoad: boolean
}

export const useSearchSGScript = ({
  pageType = "default",
  clientId,
  shouldLoad,
}: UseSearchSGScriptProps) => {
  const SEARCHSG_CONFIG_ID = "searchsg-config"

  useEffect(() => {
    if (!shouldLoad) {
      return
    }

    // Remove existing script if present
    const existingScriptTag = document.getElementById(SEARCHSG_CONFIG_ID)
    if (existingScriptTag) {
      existingScriptTag.remove()
    }

    // Create and append new script
    const scriptTag = document.createElement("script")
    scriptTag.id = SEARCHSG_CONFIG_ID
    const pageParam = pageType === "search" ? "&page=result" : ""
    scriptTag.src = `https://api.search.gov.sg/v1/searchconfig.js?clientId=${clientId}${pageParam}`
    scriptTag.setAttribute("defer", "")
    document.body.appendChild(scriptTag)

    // Cleanup function
    return () => {
      const scriptToRemove = document.getElementById(SEARCHSG_CONFIG_ID)
      if (scriptToRemove) {
        document.body.removeChild(scriptToRemove)
      }
    }
  }, [clientId, shouldLoad, pageType])
}
