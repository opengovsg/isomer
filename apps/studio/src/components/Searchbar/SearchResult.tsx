import { type ReactNode } from "react"
import { Box, HStack, Icon, Skeleton, Text, VStack } from "@chakra-ui/react"

import type { SearchResultResource } from "~/server/modules/resource/resource.types"
import { ICON_MAPPINGS } from "~/features/dashboard/components/DirectorySidebar/constants"
import { getLinkToResource } from "~/utils/resource"

export interface SearchResultProps {
  siteId: string
  item: SearchResultResource
  searchTerms?: string[]
  isLoading?: boolean
}

export const SearchResult = ({
  siteId,
  item,
  searchTerms = [],
  isLoading = false,
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

  return (
    <HStack
      py="0.75rem"
      px="0.5rem"
      spacing="1rem"
      w="full"
      as="a"
      _hover={{
        background: "interaction.muted.main.hover",
      }}
      _focus={{
        background: "interaction.muted.main.active",
      }}
      href={getLinkToResource({ siteId, type, resourceId: id })}
    >
      <Icon as={ICON_MAPPINGS[type]} fill="base.content.medium" />
      <VStack alignItems="flex-start" gap="0.25rem">
        <Box display="flex" gap="0.25rem" flexWrap="wrap">
          {isLoading ? (
            <Skeleton width="12.5rem" height="1.125rem" variant="pulse" />
          ) : (
            titleWithHighlightedText
          )}
        </Box>
        <Text textStyle="caption-2" textColor="base.content.medium">
          {isLoading ? (
            <Skeleton width="18rem" height="1.125rem" variant="pulse" />
          ) : (
            fullPermalink
          )}
        </Text>
      </VStack>
    </HStack>
  )
}
