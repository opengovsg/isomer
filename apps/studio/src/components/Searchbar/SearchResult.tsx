import { type ReactNode } from "react"
import { Box, HStack, Icon, Text, VStack } from "@chakra-ui/react"

import type { ResourceType } from "~prisma/generated/generatedEnums"
import { ICON_MAPPINGS } from "~/features/dashboard/components/DirectorySidebar/constants"
import { getLinkToResource } from "~/utils/resource"

export interface SearchResultProps {
  type: ResourceType
  title: string
  fullPermalink: string
  id: string
  siteId: string
  searchTerms?: string[]
}

export const SearchResult = ({
  type,
  title,
  fullPermalink,
  id,
  siteId,
  searchTerms = [],
}: SearchResultProps) => {
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
      <VStack alignItems="flex-start" spacing={0}>
        <Box display="flex" gap="0.25rem" flexWrap="wrap">
          {titleWithHighlightedText}
        </Box>
        <Text textStyle="caption-2" textColor="base.content.medium">
          {fullPermalink}
        </Text>
      </VStack>
    </HStack>
  )
}
