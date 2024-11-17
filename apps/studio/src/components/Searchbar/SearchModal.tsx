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

import type { SearchResultResource } from "~/server/modules/resource/resource.types"
import { useBanner } from "~/hooks/useBanner"
import { trpc } from "~/utils/trpc"
import { NoSearchResult } from "./NoSearchResult"
import { RecentlyEditedResult } from "./RecentlyEditedResult"
import { SearchResult } from "./SearchResult"

const STATES = {
  INITIAL: "initial",
  LOADING: "loading",
  NO_RESULTS: "no_results",
  SEARCH_RESULTS: "search_results",
} as const

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
  })
  const totalCount: number | undefined = data?.pages.reduce(
    (acc, page) => acc + (page.totalCount ?? 0),
    0,
  )
  const resources: SearchResultResource[] =
    data?.pages.flatMap((page) => page.resources) ?? []

  const state: (typeof STATES)[keyof typeof STATES] = !!debouncedSearchTerm
    ? isLoading
      ? STATES.LOADING
      : resources.length === 0
        ? STATES.NO_RESULTS
        : STATES.SEARCH_RESULTS
    : STATES.INITIAL

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
        h="30.625rem"
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
          overflowY="auto"
          display="flex"
          flexDir="column"
          gap="0.5rem"
        >
          <Text textColor="base.content.medium" textStyle="body-2">
            {(() => {
              switch (state) {
                case STATES.LOADING:
                  return "Searching your websites high and low"
                case STATES.NO_RESULTS:
                  return "No results found"
                case STATES.SEARCH_RESULTS:
                  return `${totalCount} search results found with "${debouncedSearchTerm}" in title`
                case STATES.INITIAL:
                  return "Recently edited on your site"
                default:
                  return <></>
              }
            })()}
          </Text>
          {(() => {
            switch (state) {
              case STATES.LOADING:
                return "TODO: add loading state"
              case STATES.NO_RESULTS:
                return <NoSearchResult />
              case STATES.SEARCH_RESULTS:
                return resources.map((resource) => (
                  <SearchResult
                    key={resource.id}
                    {...resource}
                    siteId={siteId}
                    searchTerms={debouncedSearchTerm.split(" ")}
                  />
                ))
              case STATES.INITIAL:
                return (
                  <RecentlyEditedResult
                    siteId={siteId}
                    items={data?.pages[0]?.suggestions.recentlyEdited ?? []}
                  />
                )
              default:
                return <></>
            }
          })()}
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
            {resources.length === 0
              ? "Tip: Type in the full title to get the most accurate search results."
              : "Scroll to see more results. Too many results? Try typing something longer."}
          </Text>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
