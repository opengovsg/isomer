import type { ChakraProps } from "@chakra-ui/react"
import { Box, ListItem, Text, UnorderedList, VStack } from "@chakra-ui/react"

export const SearchResultHint = (props: ChakraProps) => {
  return (
    <Box
      borderRadius="0.25rem"
      bg="utility.feedback.info-subtle"
      p="0.75rem"
      w="100%"
      {...props}
    >
      <VStack gap="0.5rem" align="start">
        <Text textStyle="caption-1">💡 Not getting the results you want?</Text>
        <Text textStyle="caption-2">
          <UnorderedList marginInlineStart="1rem">
            <ListItem>
              Type in the <u>exact</u> word. For example, “Subsidy” and
              “Subsidies” will show you different results.
            </ListItem>
            <ListItem>Check for typos.</ListItem>
          </UnorderedList>
        </Text>
      </VStack>
    </Box>
  )
}
