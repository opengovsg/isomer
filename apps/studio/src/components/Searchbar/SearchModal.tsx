import { useState } from "react"
import {
  Modal,
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
import { isMac } from "./isMac"
import {
  InitialState,
  LoadingState,
  NoResultsState,
  SearchResultsState,
} from "./SearchModalBodyContentStates"

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
  const resources: SearchResultResource[] =
    data?.pages.flatMap((page) => page.resources) ?? []

  const renderModalBody = (): React.ReactNode => {
    if (!!debouncedSearchTerm) {
      if (isLoading) {
        return <LoadingState />
      }
      if (resources.length === 0) {
        return <NoResultsState />
      }
      return (
        <SearchResultsState
          siteId={siteId}
          items={resources}
          totalResultsCount={
            data?.pages.reduce(
              (acc, page) => acc + (page.totalCount ?? 0),
              0,
            ) ?? 0
          }
          searchTerm={debouncedSearchTerm}
        />
      )
    }
    return (
      <InitialState
        siteId={siteId}
        items={data?.pages[0]?.recentlyEdited ?? []}
      />
    )
  }

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
        {renderModalBody()}
        <ModalFooter
          bg="base.canvas.alt"
          border="1px solid"
          borderColor="base.divider.medium"
          px="1.25rem"
          display="flex"
          flexDir="row"
          pt="0.75rem"
          pb="1rem"
          justifyContent="space-between"
          borderBottomRadius="base"
        >
          <Text textStyle="caption-2" textColor="base.content.medium">
            {resources.length === 0
              ? "Tip: Type in the full title to get the most accurate search results."
              : "Scroll to see more results. Too many results? Try typing something longer."}
          </Text>
          <Text
            textStyle="caption-1"
            textColor="base.content.medium"
            bg="white"
            py="0.125rem"
            px="0.375rem"
            borderRadius="base"
            border="1px solid"
            borderColor="base.divider.medium"
            boxShadow="sm"
          >
            {isMac ? "⌘ + K" : "Ctrl + K"}
          </Text>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
