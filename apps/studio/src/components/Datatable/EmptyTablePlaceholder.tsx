import { Flex, Stack, Td, Text, Tr } from "@chakra-ui/react"

export const EmptyTablePlaceholder = ({
  entityName,
  hasSearchTerm,
}: {
  entityName: string
  hasSearchTerm: boolean
}) => {
  return (
    <Tr aria-hidden>
      <Td colSpan={8}>
        <Flex align="center" justify="center" p="2rem">
          <Stack align="center" spacing="0.375rem">
            <Text textStyle="subhead-4">
              No {entityName}
              {hasSearchTerm ? " found" : ""}
            </Text>
            {hasSearchTerm && (
              <Text textStyle="body-2">Try different search terms</Text>
            )}
          </Stack>
        </Flex>
      </Td>
    </Tr>
  )
}
