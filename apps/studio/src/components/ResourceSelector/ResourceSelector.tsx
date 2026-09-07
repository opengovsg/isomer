import type { ResourceItemContent } from "~/schemas/resource"
import type { SearchResultResource } from "~/server/modules/resource/resource.types"
import { Box, Flex, Skeleton, Text, VStack } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { Suspense, useMemo } from "react"
import { useSearchQuery } from "~/hooks/useSearchQuery"
import { ResourceType } from "~prisma/generated/generatedEnums"

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
  onChange: (resourceId: string | null, fullPermalink: string) => void
  selectedResourceId?: string
  existingResource?: ResourceItemContent
  fileExplorerHeight?: number
  // Whether to render the "You selected ..." preview box below the tree.
  // Defaults to true; the move modal hides it in favour of its own notice.
  showSelectedResourcePreview?: boolean
}

const LINK_RESOURCE_TYPES = [
  ResourceType.Page,
  ResourceType.Folder,
  ResourceType.Collection,
  ResourceType.CollectionPage,
]

const getMoveSearchResourceTypes = (
  existingResource: ResourceItemContent | undefined,
) => {
  if (
    existingResource?.type === ResourceType.CollectionPage ||
    existingResource?.type === ResourceType.CollectionLink
  ) {
    return [ResourceType.Collection]
  }

  return [ResourceType.Folder]
}

const SuspensableResourceSelector = ({
  interactionType,
  siteId,
  onChange,
  selectedResourceId,
  existingResource,
  fileExplorerHeight = FILE_EXPLORER_DEFAULT_HEIGHT_IN_REM,
  showSelectedResourcePreview = true,
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
    rootPage,
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
    existingResource,
    selectedResourceId,
    siteId,
  })

  const {
    resourceItemsWithAncestryStack,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useResourceQuery({
    isResourceHighlighted,
    moveDest,
    parentDest,
    resourceIds: isSearchQueryEmpty
      ? undefined
      : matchedResources.map((resource) => resource.id),
    showOnlyContainers: interactionType === "move",
    siteId,
  })

  const {
    isResourceIdHighlighted,
    isHomeHighlighted,
    isResourceItemDisabled,
    hasParentInStack,
    handleClickBackButton,
    handleClickResourceItem,
  } = useResourceSelector({
    existingResource,
    interactionType,
    isResourceHighlighted,
    moveDest,
    onChange: (resourceId: string | null, fullPermalink: string) => {
      onChange(resourceId, fullPermalink)
      clearSearchValue()
    },
    removeFromStack,
    resourceStack,
    setIsResourceHighlighted,
    setResourceStack,
    siteId,
  })

  const renderedHeader = useMemo(() => 
    (
      <Suspense fallback={<LoadingHeader />}>
        <SuspendableHeader
          viewState={{
            isSearchQueryEmpty,
            hasParentInStack,
            isLoading,
            isHomeHighlighted,
          }}
          handleClickBackButton={handleClickBackButton}
          resourceItemsWithAncestryStack={resourceItemsWithAncestryStack}
          handleOnClick={() =>{ 
            handleClickResourceItem([
              {
                title: "Home",
                permalink: "",
                type: ResourceType.RootPage,
                id: rootPage.id,
                parentId: null,
              },
            ]); }
          }
          searchQuery={searchQuery}
        />
      </Suspense>
    )
  , [
    isSearchQueryEmpty,
    hasParentInStack,
    handleClickBackButton,
    resourceItemsWithAncestryStack,
    handleClickResourceItem,
    searchQuery,
    isLoading,
    isHomeHighlighted,
    rootPage.id,
  ])

  const renderedContent = useMemo(() => 
    (
      <Suspense fallback={<LoadingResourceItemsResults />}>
        <SuspendableContent
          resourceItemsWithAncestryStack={resourceItemsWithAncestryStack}
          isResourceIdHighlighted={isResourceIdHighlighted}
          isResourceItemDisabled={isResourceItemDisabled}
          viewState={{
            hasAdditionalLeftPadding,
            isSearchQueryEmpty,
            isLoading,
          }}
          handleClickResourceItem={handleClickResourceItem}
          searchQuery={searchQuery}
          clearSearchValue={clearSearchValue}
        />
      </Suspense>
    )
  , [
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
      {showSelectedResourcePreview && (
        <Box bg="utility.feedback.info-subtle" p="0.75rem" w="full">
          <Flex flexDirection="column" gap="0.25rem">
            <Text textStyle="caption-1">You selected /{fullPermalink}</Text>
            {existingResource && (
              <Text textStyle="caption-2">
                The URL for &quot;{existingResource.title}&quot; will change to
                /{moveDestPermalink}
              </Text>
            )}
          </Flex>
        </Box>
      )}
    </>
  )
}

export const ResourceSelector = (props: ResourceSelectorProps) => {
  const resourceTypes =
    props.interactionType === "move"
      ? getMoveSearchResourceTypes(props.existingResource)
      : LINK_RESOURCE_TYPES

  const {
    searchValue,
    setSearchValue,
    debouncedSearchTerm: searchQuery,
    isLoading,
    matchedResources,
    clearSearchValue,
  } = useSearchQuery({
    resourceTypes,
    siteId: String(props.siteId),
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
