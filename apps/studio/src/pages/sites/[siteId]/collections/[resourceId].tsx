import { Box, HStack, Stack, Text, useDisclosure } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { BiData } from "react-icons/bi"
import { z } from "zod"

import { CollectionBanner } from "~/features/dashboard/components/CollectionBanner"
import { CollectionTable } from "~/features/dashboard/components/CollectionTable"
import { useQueryParse } from "~/hooks/useQueryParse"
import { type NextPageWithLayout } from "~/lib/types"
import { AdminCmsSidebarLayout } from "~/templates/layouts/AdminCmsSidebarLayout"
import { trpc } from "~/utils/trpc"

const sitePageSchema = z.object({
  siteId: z.coerce.number(),
  resourceId: z.coerce.number(),
})

const CollectionResourceListPage: NextPageWithLayout = () => {
  const {
    // isOpen: isPageCreateModalOpen,
    onOpen: onPageCreateModalOpen,
    // onClose: onPageCreateModalClose,
  } = useDisclosure()
  const { siteId, resourceId } = useQueryParse(sitePageSchema)

  // TODO: Handle not found error in error boundary
  const [metadata] = trpc.collection.getMetadata.useSuspenseQuery({
    siteId,
    resourceId,
  })

  return (
    <>
      <Stack w="100%" p="1.75rem" gap="1rem">
        {/* TODO: Add breadcrumb */}
        <HStack w="100%" gap="1.5rem">
          <HStack gap="0.75rem" flex={1}>
            <Box
              aria-hidden
              bg="brand.secondary.100"
              p="0.5rem"
              borderRadius="6px"
            >
              <BiData />
            </Box>
            <Text textStyle="h3">{metadata.title}</Text>
          </HStack>
          <HStack align="center" gap="0.75rem">
            <Button onClick={onPageCreateModalOpen} size="sm">
              Add new item
            </Button>
          </HStack>
        </HStack>
        <CollectionBanner />
        <Box width="100%">
          <CollectionTable resourceId={resourceId} siteId={siteId} />
        </Box>
      </Stack>
      {/* <CreateCollectionPageModal
        isOpen={isPageCreateModalOpen}
        onClose={onPageCreateModalClose}
        siteId={siteId}
      /> */}
    </>
  )
}

CollectionResourceListPage.getLayout = AdminCmsSidebarLayout
export default CollectionResourceListPage
