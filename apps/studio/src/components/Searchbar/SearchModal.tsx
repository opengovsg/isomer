import { useCallback, useState } from "react"
import {
  Modal,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
} from "@chakra-ui/react"
import { Searchbar as OgpSearchBar } from "@opengovsg/design-system-react"

import { useSearchQuery } from "~/hooks/useSearchQuery"
import { getUserViewableResourceTypes } from "~/utils/resources"
import { CommandKey } from "./CommandKey"
import {
  InitialState,
  LoadingState,
  NoResultsState,
  SearchResultsState,
} from "./SearchModalBodyContentStates"
import { useSearchStyle } from "./useSearchStyle"

interface SearchModalProps {
  isOpen: boolean
  onClose: () => void
  siteId: string
}
export const SearchModal = ({ siteId, isOpen, onClose }: SearchModalProps) => {
  const [queryCount, setQueryCount] = useState(0)
  const {
    setSearchValue,
    debouncedSearchTerm,
    matchedResources,
    isLoading,
    totalResultsCount,
    recentlyEditedResources,
  } = useSearchQuery({
    siteId,
    resourceTypes: getUserViewableResourceTypes(),
    onSearchSuccess: useCallback(() => {
      setQueryCount((prev) => prev + 1)
    }, []),
  })

  const renderModalBody = (): React.ReactNode => {
    if (!!debouncedSearchTerm) {
      if (isLoading) {
        return <LoadingState />
      }
      if (matchedResources.length === 0) {
        return <NoResultsState />
      }
      return (
        <SearchResultsState
          siteId={siteId}
          items={matchedResources}
          totalResultsCount={totalResultsCount}
          searchTerm={debouncedSearchTerm}
          // 3 is an arbitrary number that we are trying out and our guess
          // of the number of queries the user has to do before they are deemed "lost"
          shouldShowHint={queryCount >= 3}
        />
      )
    }
    return <InitialState siteId={siteId} items={recentlyEditedResources} />
  }
  const { minWidth, maxWidth, marginTop } = useSearchStyle()

  return (
    <Modal isOpen={isOpen} onClose={onClose} motionPreset="none">
      <ModalOverlay bg="none" backdropFilter="brightness(80%)" />
      <ModalContent
        rounded="base"
        minW={minWidth}
        maxW={maxWidth}
        p={0}
        mt={`calc(${marginTop} + 1px)`}
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
            minW={minWidth}
            maxW={maxWidth}
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
            {matchedResources.length === 0
              ? "Tip: Type in the full title to get the most accurate search results."
              : "Scroll to see more results. Too many results? Try typing something longer."}
          </Text>
          <CommandKey boxShadow="sm" />
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
