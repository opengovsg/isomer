import { ModalBody, Text, VStack } from "@chakra-ui/react"
import { ResourceType } from "~prisma/generated/generatedEnums"

import type { SearchResultProps } from "./SearchResult"
import { NoSearchResultSvgr } from "./NoSearchResultSvgr"
import { SearchResult } from "./SearchResult"

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
  items: Omit<SearchResultProps, "siteId">[]
}) => {
  return (
    <BaseState
      headerText="Recently edited"
      content={
        <VStack gap="0.5rem" w="full">
          {items.map((item) => {
            return <SearchResult key={item.id} {...item} siteId={siteId} />
          })}
        </VStack>
      }
    />
  )
}

export const LoadingState = () => {
  return (
    <BaseState
      headerText="Searching your websites high and low"
      content={
        <VStack gap="0.5rem" w="full">
          {Array.from({ length: 5 }).map((_) => (
            <SearchResult
              isLoading
              type={ResourceType.Page}
              title=""
              fullPermalink=""
              id=""
              siteId=""
            />
          ))}
        </VStack>
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
  items: Omit<SearchResultProps, "siteId">[]
  totalResultsCount: number
  searchTerm: string
}) => {
  return (
    <BaseState
      headerText={`${totalResultsCount} search results found for "${searchTerm}" in title`}
      content={
        <VStack gap="0.5rem" w="full">
          {items.map((item) => (
            <SearchResult
              key={item.id}
              {...item}
              siteId={siteId}
              searchTerms={searchTerm.split(" ")}
            />
          ))}
        </VStack>
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
