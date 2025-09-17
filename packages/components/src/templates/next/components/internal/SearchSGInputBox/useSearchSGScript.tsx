"use client"

import { useEffect } from "react"

import { SearchSGInputBoxProps } from "~/interfaces"

interface UseSearchSGScriptProps {
  clientId: SearchSGInputBoxProps["clientId"]
  shouldLoad: boolean
}

export const useSearchSGScript = ({
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
    scriptTag.src = `https://api.search.gov.sg/v1/searchconfig.js?clientId=${clientId}`
    scriptTag.setAttribute("defer", "")
    document.body.appendChild(scriptTag)
  }, [clientId, shouldLoad])
}
