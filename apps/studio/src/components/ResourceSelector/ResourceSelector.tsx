import { Suspense } from "react"
import { Box, Flex, Skeleton, Text, VStack } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { ResourceType } from "~prisma/generated/generatedEnums"

import type { PendingMoveResource } from "~/features/editing-experience/types"
import { useSearchQuery } from "~/hooks/useSearchQuery"
import { getUserViewableResourceTypes } from "~/utils/resources"
import {
  NoItemsInFolderResult,
  ResourceItemsResults,
  ZeroResult,
} from "./ResourceSelectorContent"
import {
  BackButtonHeader,
  HomeHeader,
  SearchResultsHeader,
} from "./ResourceSelectorHeader"
import { SearchBar } from "./SearchBar"
import { useResourceStack } from "./useResourceStack"

interface ResourceSelectorProps {
  siteId: number
  onChange: (resourceId: string) => void
  selectedResourceId?: string
  existingResource?: PendingMoveResource
  onlyShowFolders?: boolean
}

const SuspensableResourceSelector = ({
  siteId,
  onChange,
  selectedResourceId,
  existingResource,
  onlyShowFolders = false,
}: ResourceSelectorProps) => {
  const {
    searchValue,
    setSearchValue,
    debouncedSearchTerm: searchQuery,
    resources,
  } = useSearchQuery({
    siteId: String(siteId),
    resourceTypes: onlyShowFolders
      ? [ResourceType.Folder]
      : getUserViewableResourceTypes(),
  })

  const {
    fullPermalink,
    isResourceHighlighted,
    setIsResourceHighlighted,
    moveDest,
    resourceItems,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    addToStack,
    removeFromStack,
    isResourceIdHighlighted,
    shouldShowBackButton,
  } = useResourceStack({
    siteId,
    onChange,
    selectedResourceId,
    onlyShowFolders,
  })

  // TODO: Fix this
  const isShowingSearchResults = !!searchQuery && searchQuery.length > 0

  const renderHeader = () => {
    if (shouldShowBackButton) {
      return (
        <BackButtonHeader
          handleOnClick={() => {
            if (isResourceHighlighted) {
              setIsResourceHighlighted(false)
              removeFromStack(2)
            } else {
              removeFromStack(1)
            }
          }}
        />
      )
    }
    if (isShowingSearchResults) {
      return (
        <SearchResultsHeader
          resultsCount={resourceItems.length}
          searchQuery={searchQuery}
        />
      )
    }
    return <HomeHeader />
  }

  const renderContent = () => {
    if (isShowingSearchResults && resourceItems.length === 0) {
      return (
        <ZeroResult
          searchQuery={searchQuery}
          handleClickClearSearch={() => setSearchValue("")}
        />
      )
    }
    if (resourceItems.length === 0) {
      return <NoItemsInFolderResult />
    }
    return (
      <ResourceItemsResults
        resourceItems={resourceItems}
        isResourceIdHighlighted={isResourceIdHighlighted}
        existingResource={existingResource}
        isResourceHighlighted={isResourceHighlighted}
        setIsResourceHighlighted={setIsResourceHighlighted}
        addToStack={addToStack}
        removeFromStack={removeFromStack}
        hasAdditionalLeftPadding={!isShowingSearchResults}
      />
    )
  }

  return (
    <VStack gap="0.5rem" w="full">
      <SearchBar searchValue={searchValue} setSearchValue={setSearchValue} />
      <Box
        borderRadius="md"
        border="1px solid"
        borderColor="base.divider.strong"
        w="full"
        py="0.75rem"
        px="0.5rem"
        h="17.5rem"
        overflowY="auto"
        display="flex"
        flexDirection="column"
        gap="0.25rem"
      >
        {renderHeader()}
        {renderContent()}
        {hasNextPage && (
          <Button
            variant="link"
            pl="2.25rem"
            size="xs"
            isLoading={isFetchingNextPage}
            onClick={() => fetchNextPage()}
          >
            Load more
          </Button>
        )}
      </Box>
      {!!moveDest && (
        <Box bg="utility.feedback.info-subtle" p="0.75rem" w="full">
          <Flex flexDirection="column" gap="0.25rem">
            <Text textStyle="caption-1">You selected {fullPermalink}</Text>
            {existingResource && (
              <Text textStyle="caption-2">
                The URL for {existingResource.title} will change to{" "}
                {`${fullPermalink}/${existingResource.permalink}`}
              </Text>
            )}
          </Flex>
        </Box>
      )}
    </VStack>
  )
}

export const ResourceSelector = (props: ResourceSelectorProps) => {
  return (
    <Suspense fallback={<Skeleton h="4rem" />}>
      <SuspensableResourceSelector {...props} />
    </Suspense>
  )
}
