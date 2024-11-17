import { VStack } from "@chakra-ui/react"

import type { SearchResultProps } from "./SearchResult"
import { SearchResult } from "./SearchResult"

export const RecentlyEditedResult = ({
  items,
  siteId,
}: {
  items: Omit<SearchResultProps, "siteId">[]
  siteId: string
}) => {
  return (
    <VStack>
      {items.map((item) => {
        return <SearchResult {...item} siteId={siteId} />
      })}
    </VStack>
  )
}
