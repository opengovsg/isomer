"use client"

import { useEffect } from "react"

import type { SearchSGInputBoxProps } from "~/interfaces"
import { twMerge } from "~/lib/twMerge"

const SearchSGInputBox = ({
  clientId,
  isOpen,
  className,
}: Omit<SearchSGInputBoxProps, "type">) => {
  useEffect(() => {
    if (!isOpen) {
      return
    }

    const existingScriptTag = document.getElementById("searchsg-config")
    if (existingScriptTag) {
      existingScriptTag.remove()
    }

    const scriptTag = document.createElement("script")
    scriptTag.id = "searchsg-config"
    scriptTag.src = `https://api.search.gov.sg/v1/searchconfig.js?clientId=${clientId}`
    scriptTag.setAttribute("defer", "")
    document.body.appendChild(scriptTag)
  }, [clientId, isOpen])

  return (
    <div
      id="searchsg-searchbar"
      className={twMerge("h-[3.25rem] lg:h-16", className)}
    />
  )
}

export default SearchSGInputBox
