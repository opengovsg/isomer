import { ModalBody, Text, VStack } from "@chakra-ui/react"
import { ResourceType } from "~prisma/generated/generatedEnums"

import type { SearchResultProps } from "./SearchResult"
import type { SearchResultResource } from "~/server/modules/resource/resource.types"
import { NoSearchResultSvgr } from "../Svg/NoSearchResultSvgr"
import { SearchResult } from "./SearchResult"

const SearchResults = ({
  siteId,
  items,
  searchTerms,
  isLoading,
  isSimplifiedView = false,
  shouldHideLastEditedText = false,
}: Omit<SearchResultProps, "item"> & {
  items: SearchResultResource[]
  isSimplifiedView?: boolean
  shouldHideLastEditedText?: boolean
}) => {
  return (
    <VStack gap="0.25rem" w="full">
      {items.map((item) => (
        <SearchResult
          key={item.id}
          siteId={siteId}
          item={item}
          searchTerms={searchTerms}
          isLoading={isLoading}
          isSimplifiedView={isSimplifiedView}
          shouldHideLastEditedText={shouldHideLastEditedText}
        />
      ))}
    </VStack>
  )
}

const BaseState = ({
  headerText,
  content,
}: {
  headerText?: string
  content: React.ReactNode
}): React.ReactNode => {
  return (
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
      {headerText && (
        <Text textColor="base.content.medium" textStyle="body-2">
          {headerText}
        </Text>
      )}
      {content}
    </ModalBody>
  )
}

export const InitialState = ({
  siteId,
  items,
}: {
  siteId: string
  items: SearchResultResource[]
}) => {
  return (
    <BaseState
      headerText="Pages recently edited on your site"
      content={
        <SearchResults
          siteId={siteId}
          items={items}
          isSimplifiedView={true}
          shouldHideLastEditedText={true}
        />
      }
    />
  )
}

export const LoadingState = () => {
  return (
    <BaseState
      headerText="Searching your website high and low"
      content={
        <SearchResults
          siteId=""
          items={Array.from({ length: 5 }).map((_, index) => ({
            id: `loading-${index}`,
            parentId: null,
            lastUpdatedAt: null,
            title: `Loading... ${index + 1}`,
            fullPermalink: "",
            type: ResourceType.Page,
          }))}
          isLoading={true}
        />
      }
    />
  )
}

export const SearchResultsState = ({
  siteId,
  items,
  totalResultsCount,
  searchTerm,
}: {
  siteId: string
  items: SearchResultResource[]
  totalResultsCount: number
  searchTerm: string
}) => {
  return (
    <BaseState
      headerText={`${totalResultsCount} search result${totalResultsCount === 1 ? "" : "s"} with "${searchTerm}" in title`}
      content={
        <SearchResults
          siteId={siteId}
          items={items}
          searchTerms={searchTerm.split(" ")}
        />
      }
    />
  )
}

export const NoResultsState = () => {
  return (
    <BaseState
      content={
        <VStack align="center" gap="0.5rem" h="100%" justify="center">
          <NoSearchResultSvgr />
          <Text textStyle="subhead-2">
            We’ve looked everywhere, but we’re getting nothing.
          </Text>
          <Text textStyle="caption-2">Try searching for something else.</Text>
        </VStack>
      }
    />
  )
}
