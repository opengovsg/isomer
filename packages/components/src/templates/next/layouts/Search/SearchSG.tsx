import { useSearchSGScript } from "~/hooks/useSearchSGScript"
import { island } from "~/islands/island"

const SearchSGComponent = ({ clientId }: { clientId: string }) => {
  useSearchSGScript({ clientId, pageType: "search", shouldLoad: true })

  return <div id="searchsg-result-container" className="h-[29.25rem]" />
}

export const SearchSG = island("SearchSG", SearchSGComponent, {
  hydrate: "load",
})
