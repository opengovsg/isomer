import { type ReactNode } from "react"
import { Box, HStack, Icon, Skeleton, Text, VStack } from "@chakra-ui/react"

import type { SearchResultResource } from "~/server/modules/resource/resource.types"
import { formatDate } from "~/utils/formatDate"
import { getLinkToResource } from "~/utils/resource"
import { getIcon, isAllowedToHaveLastEditedText } from "~/utils/resources"

export interface SearchResultProps {
  siteId: string
  item: SearchResultResource
  searchTerms?: string[]
  isLoading?: boolean
  isSimplifiedView?: boolean
  shouldHideLastEditedText?: boolean
}

export const SearchResult = ({
  siteId,
  item,
  searchTerms = [],
  isLoading = false,
  isSimplifiedView = false,
  shouldHideLastEditedText = false,
}: SearchResultProps) => {
  const { id, title, type, fullPermalink, lastUpdatedAt } = item
  const titleWithHighlightedText: ReactNode[] = title
    .split(" ")
    .map((titleWord) => {
      let matchingSearchTerm: string | null = null
      for (const searchTerm of searchTerms) {
        if (titleWord.toLowerCase().startsWith(searchTerm.toLowerCase())) {
          matchingSearchTerm = searchTerm
          break
        }
      }
      const highlightedText: string = titleWord.slice(
        0,
        matchingSearchTerm?.length ?? 0,
      )
      const nonHighlightedText: string = titleWord.slice(
        matchingSearchTerm?.length ?? 0,
      )
      return (
        <Box display="flex" whiteSpace="nowrap">
          {!!highlightedText && (
            <Text
              textStyle="subhead-2"
              textColor="base.content.default"
              backgroundColor="interaction.main-subtle.default"
              borderRadius="base"
            >
              {highlightedText}
            </Text>
          )}
          {!!nonHighlightedText && (
            <Text textStyle="subhead-2" textColor="base.content.default">
              {nonHighlightedText}
            </Text>
          )}
        </Box>
      )
    })

  const shouldShowLastEditedText: boolean =
    !shouldHideLastEditedText && isAllowedToHaveLastEditedText(type)

  const renderTitleContent = () => {
    if (isLoading) {
      return <Skeleton width="12.5rem" height="1.125rem" variant="pulse" />
    }
    if (isSimplifiedView) {
      return (
        <Text
          textStyle="subhead-2"
          textColor="base.content.default"
          noOfLines={1}
        >
          {title}
        </Text>
      )
    }
    return titleWithHighlightedText
  }

  const renderPermalink = () => {
    if (isSimplifiedView) return null

    return (
      <Text textStyle="caption-2" textColor="base.content.medium" noOfLines={1}>
        {isLoading ? (
          <Skeleton width="18rem" height="1.125rem" variant="pulse" />
        ) : (
          `/${fullPermalink}`
        )}
      </Text>
    )
  }

  return (
    <HStack
      py="0.75rem"
      px="0.5rem"
      spacing="0.75rem"
      w="full"
      as="a"
      _hover={{
        background: "interaction.muted.main.hover",
      }}
      _focus={{
        background: "interaction.muted.main.active",
      }}
      href={getLinkToResource({ siteId, type, resourceId: id })}
      borderRadius="0.25rem"
      alignItems="flex-start"
    >
      <Icon
        as={getIcon(type)}
        fill="base.content.medium"
        height="1.25rem" // to align with the text that has a line height of 1.25rem
      />
      <Box display="flex" flexDir="column" gap="0.5rem">
        <VStack alignItems="flex-start" gap="0.25rem">
          <Box
            display="flex"
            rowGap="0.125rem"
            columnGap="0.25rem"
            flexWrap="wrap"
          >
            {renderTitleContent()}
          </Box>
          {renderPermalink()}
        </VStack>
        {!!lastUpdatedAt && shouldShowLastEditedText && (
          <Text textStyle="legal" textColor="interaction.support.placeholder">
            {`Last edited ${formatDate(lastUpdatedAt)}`}
          </Text>
        )}
      </Box>
    </HStack>
  )
}
