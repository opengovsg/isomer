import { VStack } from "@chakra-ui/react"

import type { SearchResultProps } from "./SearchResult"
import { SearchResult } from "./SearchResult"

export const SearchResults = ({
  items,
  siteId,
}: {
  items: Omit<SearchResultProps, "siteId">[]
  siteId: string
}) => {
  return (
    <VStack>
      {items.map((item) => {
        return <SearchResult key={item.id} {...item} siteId={siteId} />
      })}
    </VStack>
  )
}
