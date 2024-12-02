import type { ChakraProps } from "@chakra-ui/react"
import type { PropsWithChildren } from "react"
import { ModalBody as ChakraModalBody, Text, VStack } from "@chakra-ui/react"
import { ResourceType } from "~prisma/generated/generatedEnums"

import type { SearchResultProps } from "./SearchResult"
import type { SearchResultResource } from "~/server/modules/resource/resource.types"
import { NoSearchResultSvgr } from "../Svg/NoSearchResultSvgr"
import { SearchResult } from "./SearchResult"
import { SearchResultHint } from "./SearchResultHint"

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

const ModalBody = ({ children, ...props }: PropsWithChildren & ChakraProps) => {
  return (
    <ChakraModalBody
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
      gap="1rem"
      {...props}
    >
      {children}
    </ChakraModalBody>
  )
}

const HeaderTextAndContent = ({
  headerText,
  showSearchResultHint = false,
  content,
  ...props
}: {
  headerText?: string
  showSearchResultHint?: boolean
  content: React.ReactNode
} & ChakraProps) => {
  return (
    <VStack gap="0.75rem" align="start" w="full" {...props}>
      {headerText && (
        <Text textColor="base.content.medium" textStyle="body-2">
          {headerText}
        </Text>
      )}
      {showSearchResultHint && <SearchResultHint />}
      {content}
    </VStack>
  )
}

const numberOfItemsToShowForEachSection = 3
export const InitialState = ({
  siteId,
  items,
}: {
  siteId: string
  items: SearchResultResource[]
}) => {
  return (
    <ModalBody>
      <HeaderTextAndContent
        headerText="Pages you’ve recently opened"
        content={
          <SearchResults
            siteId={siteId}
            items={items.slice(0, numberOfItemsToShowForEachSection)}
            isSimplifiedView={true}
            shouldHideLastEditedText={true}
          />
        }
      />
      <HeaderTextAndContent
        headerText="Pages recently edited on your site"
        content={
          <SearchResults
            siteId={siteId}
            items={items.slice(0, numberOfItemsToShowForEachSection)}
            isSimplifiedView={true}
            shouldHideLastEditedText={true}
          />
        }
      />
    </ModalBody>
  )
}

export const LoadingState = () => {
  return (
    <ModalBody>
      <HeaderTextAndContent
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
    </ModalBody>
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
    <ModalBody>
      <HeaderTextAndContent
        headerText={`${totalResultsCount} search result${totalResultsCount === 1 ? "" : "s"} with "${searchTerm}" in title`}
        showSearchResultHint
        content={
          <SearchResults
            siteId={siteId}
            items={items}
            searchTerms={searchTerm.split(" ")}
          />
        }
        gap="0.5rem"
      />
    </ModalBody>
  )
}

export const NoResultsState = () => {
  return (
    <ModalBody
      children={
        <HeaderTextAndContent
          content={
            <VStack
              align="center"
              gap="0.5rem"
              w="full"
              h="full"
              justify="center"
            >
              <NoSearchResultSvgr />
              <Text textStyle="subhead-2">
                We’ve looked everywhere, but we’re getting nothing.
              </Text>
              <SearchResultHint maxW="27.5rem" />
            </VStack>
          }
        />
      }
      justifyContent="center"
    />
  )
}
