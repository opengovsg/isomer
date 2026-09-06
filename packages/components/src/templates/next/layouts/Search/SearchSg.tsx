"use client"

import { useSearchSgScript } from "~/hooks/useSearchSgScript"

export const SearchSG = ({ clientId }: { clientId: string }) => {
  useSearchSgScript({ clientId, pageType: "search", shouldLoad: true })

  return <div id="searchsg-result-container" className="h-[29.25rem]" />
}
