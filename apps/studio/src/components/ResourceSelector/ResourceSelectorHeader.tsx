import { Flex, HStack, Spacer, Text } from "@chakra-ui/react"
import { Link } from "@opengovsg/design-system-react"
import { BiHomeAlt, BiLeftArrowAlt } from "react-icons/bi"

const HomeHeader = () => {
  return (
    <Flex
      w="full"
      px="0.75rem"
      py="0.375rem"
      color="base.content.default"
      alignItems="center"
    >
      <HStack spacing="0.25rem">
        <BiHomeAlt />
        <Text textStyle="caption-1">/</Text>
      </HStack>
      <Spacer />
      <Text
        color="base.content.medium"
        textTransform="uppercase"
        textStyle="caption-1"
        overflow="hidden"
        textOverflow="ellipsis"
        whiteSpace="nowrap"
      >
        Home
      </Text>
    </Flex>
  )
}

const BackButton = ({ handleOnClick }: { handleOnClick: () => void }) => {
  return (
    <Link
      variant="clear"
      w="full"
      justifyContent="flex-start"
      color="base.content.default"
      onClick={handleOnClick}
      as="button"
    >
      <HStack spacing="0.25rem" color="interaction.links.default">
        <BiLeftArrowAlt />
        <Text textStyle="caption-1">Back to parent folder</Text>
      </HStack>
    </Link>
  )
}

const SearchResultsHeader = ({
  resultsCount,
  searchQuery,
}: {
  resultsCount: number
  searchQuery: string
}) => {
  return (
    <Text textStyle="caption-2" px="0.5rem" pt="0.25rem" pb="0.5rem">
      {resultsCount} result{resultsCount > 1 ? "s" : ""} with "{searchQuery}" in
      title
    </Text>
  )
}

export const ResourceSelectorHeader = ({
  shouldShowBackButton,
  handleBackButtonClick,
  isShowingSearchResults,
  resultsCount,
  searchQuery,
}: {
  shouldShowBackButton: boolean
  handleBackButtonClick: () => void
  isShowingSearchResults: boolean
  resultsCount: number
  searchQuery: string
}) => {
  if (shouldShowBackButton) {
    return <BackButton handleOnClick={handleBackButtonClick} />
  }

  if (isShowingSearchResults) {
    return (
      <SearchResultsHeader
        resultsCount={resultsCount}
        searchQuery={searchQuery}
      />
    )
  }

  return <HomeHeader />
}
