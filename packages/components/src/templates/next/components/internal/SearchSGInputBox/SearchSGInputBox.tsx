"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"

import type { SearchSGInputBoxProps } from "~/interfaces"

const SearchSGInputBox = ({
  clientId,
}: Omit<SearchSGInputBoxProps, "type">) => {
  const pathname = usePathname()

  useEffect(() => {
    const scriptTag = document.createElement("script")
    scriptTag.src = `https://api.search.gov.sg/v1/searchconfig.js?clientId=${clientId}`
    scriptTag.setAttribute("defer", "")
    document.body.appendChild(scriptTag)
  }, [clientId, pathname])

  return <div id="searchsg-searchbar" />
}

export default SearchSGInputBox
