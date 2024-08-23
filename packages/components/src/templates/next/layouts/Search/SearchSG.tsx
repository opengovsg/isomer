"use client"

import { useEffect } from "react"

const SearchSG = ({ clientId }: { clientId: string }) => {
  useEffect(() => {
    const scriptTag = document.createElement("script")
    scriptTag.id = "searchsg-config"
    scriptTag.src = `https://api.search.gov.sg/v1/searchconfig.js?clientId=${clientId}&page=result`
    scriptTag.setAttribute("defer", "")
    document.body.appendChild(scriptTag)
  }, [clientId])

  return <div id="searchsg-result-container" className="h-[29.25rem]" />
}

export default SearchSG
