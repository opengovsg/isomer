import { Box, Button, Divider, Flex, Text, VStack } from "@chakra-ui/react"
import { format } from "date-fns"
import { useState } from "react"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { useQueryParse } from "~/hooks/useQueryParse"
import { trpc } from "~/utils/trpc"

import type { PageDiffModalRow } from "./PageDiffModal"
import { pageSchema } from "../../schema"
import { DrawerHeader } from "./DrawerHeader"
import { PageDiffModal } from "./PageDiffModal"

const PAGE_SIZE = 20

export default function HistoryStateDrawer(): JSX.Element {
  const { setDrawerState } = useEditorDrawerContext()
  const { pageId, siteId } = useQueryParse(pageSchema)
  const [selectedRow, setSelectedRow] = useState<PageDiffModalRow | null>(null)

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = trpc.audit.listResourceUpdates.useInfiniteQuery(
    { pageId, siteId, limit: PAGE_SIZE },
    { getNextPageParam: (lastPage) => lastPage.nextOffset },
  )

  const rows = data?.pages.flatMap((resultPage) => resultPage.items) ?? []

  return (
    <>
      <Flex direction="column" h="full">
        <DrawerHeader
          label="Page history"
          onBackClick={() => setDrawerState({ state: "root" })}
        />
        <VStack
          align="stretch"
          spacing="0.75rem"
          p="1.5rem"
          overflowY="auto"
          flex={1}
        >
          {isLoading && <Text textStyle="body-2">Loading...</Text>}
          {!isLoading && isError && (
            <Text textStyle="body-2" color="utility.feedback.critical">
              Something went wrong while loading page history. Please try again.
            </Text>
          )}
          {!isLoading && !isError && rows.length === 0 && (
            <Text textStyle="body-2" color="base.content.medium">
              No changes yet
            </Text>
          )}
          {rows.map((row, index) => (
            <Box key={row.id}>
              <Flex justify="space-between" align="center" py="0.5rem">
                <Box>
                  <Text textStyle="body-2">
                    {format(row.createdAt, "d MMM yyyy, h:mm a")}
                  </Text>
                  <Text textStyle="caption-2" color="base.content.medium">
                    {row.actor.name}
                  </Text>
                </Box>
                <Button
                  size="xs"
                  variant="outline"
                  onClick={() => setSelectedRow(row)}
                >
                  View changes
                </Button>
              </Flex>
              {index < rows.length - 1 && <Divider />}
            </Box>
          ))}
          {!isError && hasNextPage && (
            <Button
              variant="link"
              size="xs"
              alignSelf="center"
              isLoading={isFetchingNextPage}
              onClick={() => fetchNextPage()}
            >
              Load more
            </Button>
          )}
        </VStack>
      </Flex>
      <PageDiffModal
        isOpen={!!selectedRow}
        onClose={() => setSelectedRow(null)}
        row={selectedRow}
      />
    </>
  )
}
