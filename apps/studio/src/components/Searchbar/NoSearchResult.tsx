import { Text, VStack } from "@chakra-ui/react"

import { NoSearchResultSvgr } from "./NoSearchResultSvgr"

export const NoSearchResult = () => {
  return (
    <VStack align="center" gap="0.125rem" h="100%" justify="center">
      <NoSearchResultSvgr />
      <Text textStyle="subhead-2">
        We’ve looked everywhere, but we’re getting nothing.
      </Text>
      <Text textStyle="caption-2">Try searching for something else.</Text>
    </VStack>
  )
}
