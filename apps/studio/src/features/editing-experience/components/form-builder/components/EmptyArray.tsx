import { Text, Flex } from "@chakra-ui/react"

export const EmptyArray = () => {
  return (
    <Flex
      alignItems="center"
      flexDir="column"
      px="1.5rem"
      py="3.75rem"
      mt="0.25rem"
      justifyContent="center"
      w="100%"
    >
      <Text
        textStyle="subhead-1"
        textColor="base.content.default"
        textAlign="center"
      >
        Items you add will appear here
      </Text>
    </Flex>
  )
}
