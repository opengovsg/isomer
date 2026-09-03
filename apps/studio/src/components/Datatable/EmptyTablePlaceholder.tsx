import { Flex, Stack, Td, Text, Tr } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { NoSearchResultSvgr } from "~/components/Svg/NoSearchResultSvgr"

export const EmptyTablePlaceholder = ({
  entityName,
  hasSearchTerm,
  groupLabel,
  activeFilterLabels,
  onClearFilter,
}: {
  entityName: string
  hasSearchTerm: boolean
  groupLabel: string
  // When set (and non-empty), a status filter is active and yielded no
  // rows — takes priority over the plain empty-group copy below.
  activeFilterLabels?: string[]
  onClearFilter?: () => void
}) => {
  const isFiltered = !hasSearchTerm && !!activeFilterLabels?.length

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
            {isFiltered && (
              <>
                <NoSearchResultSvgr mb="0.5rem" />
                <Text textStyle="subhead-4">No {entityName}s found.</Text>
                <Text textStyle="body-2">
                  No {entityName}s match "{activeFilterLabels.join(", ")}". Try
                  a different filter.
                </Text>
                <Button
                  variant="link"
                  size="xs"
                  textStyle="body-2"
                  onClick={onClearFilter}
                >
                  Clear filter
                </Button>
              </>
            )}
            {!hasSearchTerm && !isFiltered && (
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
