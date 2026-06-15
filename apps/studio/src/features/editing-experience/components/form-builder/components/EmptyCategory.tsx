import { Text, Flex, VStack } from "@chakra-ui/react"

export const EmptyCategory = ({ title }: { title: string }) => {
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
      <VStack spacing="0.25rem" align="center">
        <Text
          textStyle="subhead-2"
          textColor="base.content.default"
          textAlign="center"
        >
          {title}
        </Text>
        <Text
          textStyle="caption-2"
          textColor="base.content.default"
          textAlign="center"
        >
          Users will choose from this list when creating new items.
        </Text>
      </VStack>
    </Flex>
  )
}
