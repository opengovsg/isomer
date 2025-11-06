"use client"

import { useSearchSGScript } from "~/hooks/useSearchSGScript"

interface SearchSGInputBoxClientProps {
  clientId: string
  className: string
  shouldLoadScript?: boolean
}

export const SearchSGInputBoxClient = ({
  clientId,
  className,
  shouldLoadScript = true,
}: SearchSGInputBoxClientProps) => {
  useSearchSGScript({ clientId, shouldLoad: shouldLoadScript })

  return <div id="searchsg-searchbar" className={className} />
}
