import { useState } from "react"
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from "@chakra-ui/react"
import { Searchbar as OgpSearchBar } from "@opengovsg/design-system-react"
import { useDebounce } from "@uidotdev/usehooks"

import { useBanner } from "~/hooks/useBanner"
import { trpc } from "~/utils/trpc"
import { RecentlyEditedResult } from "./RecentlyEditedResult"
import { SearchResult } from "./SearchResult"

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  siteId: string
}
export const SearchModal = ({ siteId, isOpen, onClose }: SearchModalProps) => {
  const banner = useBanner()
  const mt = banner ? "3rem" : "0.5rem"
  const [searchValue, setSearchValue] = useState("")
  const debouncedSearchTerm = useDebounce(searchValue, 300)
  const { data, isLoading } = trpc.resource.search.useInfiniteQuery({
    siteId,
    query: debouncedSearchTerm,
    limit: 5,
  })
  const totalCount: number | undefined = data?.pages.reduce(
    (acc, page) => acc + (page.totalCount ?? 0),
    0,
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} motionPreset="none">
      <ModalOverlay bg="none" backdropFilter="brightness(80%)" />
      <ModalContent
        rounded="base"
        w="42.5rem"
        p={0}
        mt={`calc(${mt} + 1px)`}
        // NOTE: This is required to align the inner Searchbar
        // with the outer search bar
        ml="3px"
        boxShadow="md"
      >
        <ModalHeader p={0}>
          <OgpSearchBar
            defaultIsExpanded
            onChange={({ target }) => setSearchValue(target.value)}
            w="42.5rem"
            // border={0}
            placeholder={`Search pages, collections, or folders by name. e.g. "Speech by Minister"`}
          />
        </ModalHeader>
        <ModalBody
          border="1px solid"
          borderColor="base.divider.medium"
          borderTop={0}
          borderBottom={0}
          px="1.25rem"
          pt="1.5rem"
          pb="1rem"
          maxH="25.25rem"
        >
          <Text textColor="base.content.medium" textStyle="body-2" mb="0.5rem">
            {searchValue && isLoading && "Searching your websites high and low"}
            {!searchValue && "Recently edited on your site"}
            {data &&
              searchValue &&
              `${totalCount} search results found with "${searchValue}" in title`}
          </Text>
          {!searchValue && (
            <RecentlyEditedResult
              siteId={siteId}
              items={data?.pages[0]?.suggestions.recentlyEdited ?? []}
            />
          )}
          {data?.pages.map((page) => {
            return page.resources.map((resource) => {
              return (
                <SearchResult
                  key={resource.id}
                  {...resource}
                  siteId={siteId}
                  searchTerms={searchValue.split(" ")}
                />
              )
            })
          })}
        </ModalBody>
        <ModalFooter
          bg="base.canvas.alt"
          border="1px solid"
          borderColor="base.divider.medium"
          px="1.25rem"
          display="flex"
          flexDir="row"
          py="0.75rem"
          justifyContent="flex-start"
          borderBottomRadius="base"
        >
          <Text textStyle="caption-2" textColor="base.content.medium">
            Tip: Type in the full title to get the most accurate search results.
          </Text>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
