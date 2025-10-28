"use client"

import { useSearchSGScript } from "~/hooks/useSearchSGScript"

const SearchSG = ({ clientId }: { clientId: string }) => {
  useSearchSGScript({ clientId, pageType: "search", shouldLoad: true })

  return <div id="searchsg-result-container" className="h-[29.25rem]" />
}

export default SearchSG
