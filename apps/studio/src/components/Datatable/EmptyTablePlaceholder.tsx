import { Flex, Stack, Td, Text, Tr } from "@chakra-ui/react"

export const EmptyTablePlaceholder = ({
  entityName,
  hasSearchTerm,
  groupLabel,
}: {
  entityName: string
  hasSearchTerm: boolean
  groupLabel: string
}) => {
  return (
    <Tr aria-hidden>
      <Td colSpan={8}>
        <Flex align="center" justify="center" p="2rem">
          <Stack align="center" spacing="0.375rem">
            {hasSearchTerm && (
              <>
                <Text textStyle="subhead-4">No {entityName} found</Text>
                <Text textStyle="body-2">Try different search terms</Text>
              </>
            )}
            {!hasSearchTerm && (
              <Text textStyle="subhead-4">
                This {groupLabel} is empty. Create a new page or folder
              </Text>
            )}
          </Stack>
        </Flex>
      </Td>
    </Tr>
  )
}
