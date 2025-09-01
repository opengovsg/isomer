import { Suspense, useMemo } from "react"
import { Box, Flex, Skeleton, Text, VStack } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { ResourceType } from "~prisma/generated/generatedEnums"

import type { ResourceItemContent } from "~/schemas/resource"
import type { SearchResultResource } from "~/server/modules/resource/resource.types"
import { useSearchQuery } from "~/hooks/useSearchQuery"
import {
  LoadingResourceItemsResults,
  SuspendableContent,
} from "./ResourceSelectorContent"
import { LoadingHeader, SuspendableHeader } from "./ResourceSelectorHeader"
import { SearchBar } from "./SearchBar"
import { useResourceQuery } from "./useResourceQuery"
import { useResourceSelector } from "./useResourceSelector"
import { useResourceStack } from "./useResourceStack"

const FILE_EXPLORER_DEFAULT_HEIGHT_IN_REM = 17.5

interface ResourceSelectorProps {
  interactionType: "link" | "move"
  siteId: number
  onChange: (resourceId: string | null) => void
  selectedResourceId?: string
  existingResource?: ResourceItemContent
  onlyShowFolders?: boolean
  fileExplorerHeight?: number
}

const SuspensableResourceSelector = ({
  interactionType,
  siteId,
  onChange,
  selectedResourceId,
  existingResource,
  onlyShowFolders = false,
  fileExplorerHeight = FILE_EXPLORER_DEFAULT_HEIGHT_IN_REM,
  searchQuery,
  isLoading,
  matchedResources,
  clearSearchValue,
}: ResourceSelectorProps & {
  searchQuery: string
  isLoading: boolean
  matchedResources: SearchResultResource[]
  clearSearchValue: () => void
}) => {
  const isSearchQueryEmpty: boolean = searchQuery.trim().length === 0
  const hasAdditionalLeftPadding: boolean = isSearchQueryEmpty

  const {
    fullPermalink,
    moveDestPermalink,
    moveDest,
    parentDest,
    resourceStack,
    isResourceHighlighted,
    setIsResourceHighlighted,
    setResourceStack,
    removeFromStack,
  } = useResourceStack({
    siteId,
    selectedResourceId,
    existingResource,
  })

  const {
    resourceItemsWithAncestryStack,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useResourceQuery({
    siteId,
    moveDest,
    parentDest,
    isResourceHighlighted,
    onlyShowFolders,
    resourceIds: isSearchQueryEmpty
      ? undefined
      : matchedResources.map((resource) => resource.id),
  })

  const {
    isResourceIdHighlighted,
    isResourceItemDisabled,
    hasParentInStack,
    handleClickBackButton,
    handleClickResourceItem,
  } = useResourceSelector({
    interactionType,
    siteId,
    moveDest,
    resourceStack,
    isResourceHighlighted,
    setIsResourceHighlighted,
    existingResource,
    setResourceStack,
    removeFromStack,
    onChange: (resourceId: string | null) => {
      onChange(resourceId)
      clearSearchValue()
    },
  })

  const renderedHeader = useMemo(() => {
    return (
      <Suspense fallback={<LoadingHeader />}>
        <SuspendableHeader
          isSearchQueryEmpty={isSearchQueryEmpty}
          hasParentInStack={hasParentInStack}
          handleClickBackButton={handleClickBackButton}
          resourceItemsWithAncestryStack={resourceItemsWithAncestryStack}
          searchQuery={searchQuery}
          isLoading={isLoading}
        />
      </Suspense>
    )
  }, [
    isSearchQueryEmpty,
    hasParentInStack,
    handleClickBackButton,
    resourceItemsWithAncestryStack,
    searchQuery,
    isLoading,
  ])

  const renderedContent = useMemo(() => {
    return (
      <Suspense fallback={<LoadingResourceItemsResults />}>
        <SuspendableContent
          resourceItemsWithAncestryStack={resourceItemsWithAncestryStack}
          isResourceIdHighlighted={isResourceIdHighlighted}
          isResourceItemDisabled={isResourceItemDisabled}
          hasAdditionalLeftPadding={hasAdditionalLeftPadding}
          handleClickResourceItem={handleClickResourceItem}
          isSearchQueryEmpty={isSearchQueryEmpty}
          searchQuery={searchQuery}
          clearSearchValue={clearSearchValue}
          isLoading={isLoading}
        />
      </Suspense>
    )
  }, [
    resourceItemsWithAncestryStack,
    isResourceIdHighlighted,
    isResourceItemDisabled,
    hasAdditionalLeftPadding,
    handleClickResourceItem,
    isSearchQueryEmpty,
    searchQuery,
    clearSearchValue,
    isLoading,
  ])

  return (
    <>
      <Box
        borderRadius="md"
        border="1px solid"
        borderColor="base.divider.strong"
        w="full"
        py="0.75rem"
        px="0.5rem"
        h={`${fileExplorerHeight}rem`}
        overflowY="auto"
        display="flex"
        flexDirection="column"
        gap="0.25rem"
      >
        {renderedHeader}
        {renderedContent}
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
      <Box bg="utility.feedback.info-subtle" p="0.75rem" w="full">
        <Flex flexDirection="column" gap="0.25rem">
          <Text textStyle="caption-1">You selected /{fullPermalink}</Text>
          {existingResource && (
            <Text textStyle="caption-2">
              The URL for "{existingResource.title}" will change to /
              {moveDestPermalink}
            </Text>
          )}
        </Flex>
      </Box>
    </>
  )
}

export const ResourceSelector = (props: ResourceSelectorProps) => {
  const {
    searchValue,
    setSearchValue,
    debouncedSearchTerm: searchQuery,
    isLoading,
    matchedResources,
    clearSearchValue,
  } = useSearchQuery({
    siteId: String(props.siteId),
    resourceTypes: props.onlyShowFolders
      ? [ResourceType.Folder]
      : [
          ResourceType.Page,
          ResourceType.Folder,
          ResourceType.Collection,
          ResourceType.CollectionPage,
        ],
  })

  return (
    <VStack gap="0.5rem" w="full">
      <SearchBar searchValue={searchValue} setSearchValue={setSearchValue} />
      <Suspense
        fallback={
          <Skeleton
            w="full"
            h={`${props.fileExplorerHeight ?? FILE_EXPLORER_DEFAULT_HEIGHT_IN_REM + 4.25}rem`}
          />
        }
      >
        <SuspensableResourceSelector
          {...props}
          searchQuery={searchQuery}
          isLoading={isLoading}
          matchedResources={matchedResources}
          clearSearchValue={clearSearchValue}
        />
      </Suspense>
    </VStack>
  )
}
