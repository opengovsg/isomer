import { Flex, HStack, Spacer, Text } from "@chakra-ui/react"
import { Link } from "@opengovsg/design-system-react"
import { BiHomeAlt, BiLeftArrowAlt } from "react-icons/bi"

export const HomeHeader = () => {
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

export const LoadingHeader = () => {
  return (
    <Text textStyle="caption-2" py="0.375rem" px="0.375rem">
      Searching your website, high and low
    </Text>
  )
}

export const BackButtonHeader = ({
  handleOnClick,
}: {
  handleOnClick: () => void
}) => {
  return (
    <Link
      variant="clear"
      w="full"
      justifyContent="flex-start"
      color="base.content.default"
      onClick={handleOnClick}
      as="button"
      py="0.375rem"
    >
      <HStack spacing="0.25rem" color="interaction.links.default">
        <BiLeftArrowAlt />
        <Text textStyle="caption-1">Back to parent folder</Text>
      </HStack>
    </Link>
  )
}

export const SearchResultsHeader = ({
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
