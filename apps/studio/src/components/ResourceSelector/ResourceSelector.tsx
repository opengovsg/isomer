import { Suspense } from "react"
import { Box, Flex, Skeleton, Text, VStack } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { ResourceType } from "~prisma/generated/generatedEnums"

import type { ResourceItemContent } from "~/schemas/resource"
import { useSearchQuery } from "~/hooks/useSearchQuery"
import { getUserViewableResourceTypes } from "~/utils/resources"
import {
  LoadingResourceItemsResults,
  NoItemsInFolderResult,
  ResourceItemsResults,
  ZeroResult,
} from "./ResourceSelectorContent"
import {
  BackButtonHeader,
  HomeHeader,
  LoadingHeader,
  SearchResultsHeader,
} from "./ResourceSelectorHeader"
import { SearchBar } from "./SearchBar"
import { useResourceStack } from "./useResourceStack"

interface ResourceSelectorProps {
  siteId: number
  onChange: (resourceId: string) => void
  selectedResourceId?: string
  existingResource?: ResourceItemContent
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
    isLoading,
    resources,
    clearSearchValue,
  } = useSearchQuery({
    siteId: String(siteId),
    resourceTypes: onlyShowFolders
      ? [ResourceType.Folder]
      : getUserViewableResourceTypes(),
  })

  const isSearchQueryEmpty: boolean = searchQuery.trim().length === 0
  const hasAdditionalLeftPadding: boolean = isSearchQueryEmpty

  const {
    fullPermalink,
    moveDest,
    resourceItemsWithAncestryStack,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isResourceIdHighlighted,
    hasParentInStack,
    handleClickBackButton,
    handleClickResourceItem,
  } = useResourceStack({
    siteId,
    onChange: (resourceId: string) => {
      onChange(resourceId)
      clearSearchValue()
    },
    selectedResourceId,
    onlyShowFolders,
    resourceIds: isSearchQueryEmpty
      ? undefined
      : resources.map((resource) => resource.id),
  })

  const renderHeader = () => {
    if (isLoading) {
      return <LoadingHeader />
    }
    if (isSearchQueryEmpty) {
      return hasParentInStack ? (
        <BackButtonHeader handleOnClick={handleClickBackButton} />
      ) : (
        <HomeHeader />
      )
    }
    return (
      <SearchResultsHeader
        resultsCount={resourceItemsWithAncestryStack.length}
        searchQuery={searchQuery}
      />
    )
  }

  const renderContent = () => {
    if (isLoading) {
      return <LoadingResourceItemsResults />
    }
    if (resourceItemsWithAncestryStack.length === 0) {
      return isSearchQueryEmpty ? (
        <NoItemsInFolderResult />
      ) : (
        <ZeroResult
          searchQuery={searchQuery}
          handleClickClearSearch={clearSearchValue}
        />
      )
    }
    return (
      <ResourceItemsResults
        resourceItemsWithAncestryStack={resourceItemsWithAncestryStack}
        isResourceIdHighlighted={isResourceIdHighlighted}
        existingResource={existingResource}
        hasAdditionalLeftPadding={hasAdditionalLeftPadding}
        handleClickResourceItem={handleClickResourceItem}
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
            py="0.5rem"
            pl={hasAdditionalLeftPadding ? "2.25rem" : "1rem"}
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
    <Suspense fallback={<Skeleton h="20.75rem" />}>
      <SuspensableResourceSelector {...props} />
    </Suspense>
  )
}
