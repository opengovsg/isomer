import { type ReactNode } from "react"
import { Box, HStack, Icon, Skeleton, Text, VStack } from "@chakra-ui/react"
import { ResourceType } from "~prisma/generated/generatedEnums"

import type { SearchResultResource } from "~/server/modules/resource/resource.types"
import { ICON_MAPPINGS } from "~/features/dashboard/components/DirectorySidebar/constants"
import { getLinkToResource } from "~/utils/resource"

const formatDate = (date: Date): string => {
  const now = new Date()
  const diffInMs = now.getTime() - date.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) {
    return "today"
  } else if (diffInDays === 1) {
    return "yesterday"
  } else if (diffInDays >= 2 && diffInDays <= 6) {
    return `${diffInDays} days ago`
  } else if (diffInDays >= 7 && diffInDays <= 14) {
    return "last week"
  } else {
    // Format date as "DD MMM YYYY" for anything beyond 14 days
    const options: Intl.DateTimeFormatOptions = {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
    return date
      .toLocaleDateString("en-GB", options)
      .replace(/(\d{2}) (\w{3}) (\d{4})/, "$1 $2 $3")
  }
}

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

  const shouldShowLastEditedText: boolean =
    type === ResourceType.Page ||
    type === ResourceType.CollectionLink ||
    type === ResourceType.CollectionPage

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
      <Box display="flex" flexDir="column" gap="0.5rem">
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
              `/${fullPermalink}`
            )}
          </Text>
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
