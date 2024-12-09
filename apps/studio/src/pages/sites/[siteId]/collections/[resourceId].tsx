import {
  Box,
  BreadcrumbItem,
  BreadcrumbLink,
  HStack,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react"
import { Breadcrumb, Button } from "@opengovsg/design-system-react"
import { useSetAtom } from "jotai"
import { BiData } from "react-icons/bi"
import { z } from "zod"

import { PermissionsBoundary } from "~/components/AuthWrappers"
import { folderSettingsModalAtom } from "~/features/dashboard/atoms"
import { CollectionBanner } from "~/features/dashboard/components/CollectionBanner"
import { CollectionTable } from "~/features/dashboard/components/CollectionTable"
import { DeleteResourceModal } from "~/features/dashboard/components/DeleteResourceModal/DeleteResourceModal"
import { FolderSettingsModal } from "~/features/dashboard/components/FolderSettingsModal"
import { PageSettingsModal } from "~/features/dashboard/components/PageSettingsModal"
import { CreateCollectionPageModal } from "~/features/editing-experience/components/CreateCollectionPageModal"
import { useQueryParse } from "~/hooks/useQueryParse"
import { type NextPageWithLayout } from "~/lib/types"
import { AdminCmsSearchableLayout } from "~/templates/layouts/AdminCmsSidebarLayout"
import { trpc } from "~/utils/trpc"
import { ResourceType } from "../../../../../prisma/generated/generatedEnums"

const sitePageSchema = z.object({
  siteId: z.coerce.number(),
  resourceId: z.coerce.number(),
})

const CollectionResourceListPage: NextPageWithLayout = () => {
  const {
    isOpen: isPageCreateModalOpen,
    onOpen: onPageCreateModalOpen,
    onClose: onPageCreateModalClose,
  } = useDisclosure()
  const { siteId, resourceId } = useQueryParse(sitePageSchema)
  const setFolderSettingsModalState = useSetAtom(folderSettingsModalAtom)

  // TODO: Handle not found error in error boundary
  const [metadata] = trpc.collection.getMetadata.useSuspenseQuery({
    siteId,
    resourceId,
  })

  return (
    <>
      <Stack w="100%" p="1.75rem" gap="1rem" height="$100vh" overflow="auto">
        <Breadcrumb size="sm">
          <BreadcrumbItem>
            <BreadcrumbLink href={`/sites/${siteId}`}>
              <Text textStyle="caption-2" color="interaction.links.default">
                Home
              </Text>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbLink isCurrentPage>
              <Text textStyle="caption-2" color="base.content.default">
                {metadata.title}
              </Text>
            </BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
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
            <Text wordBreak="break-word" noOfLines={1} as="h3" textStyle="h3">
              {metadata.title}
            </Text>
          </HStack>
          <HStack align="center" gap="0.75rem">
            <Button
              variant="outline"
              size="md"
              onClick={() =>
                setFolderSettingsModalState({
                  folderId: String(resourceId),
                })
              }
            >
              Collection settings
            </Button>
            <Button onClick={onPageCreateModalOpen} size="md">
              Add new item
            </Button>
          </HStack>
        </HStack>
        <CollectionBanner />
        <Box width="100%">
          <CollectionTable resourceId={resourceId} siteId={siteId} />
        </Box>
      </Stack>
      <CreateCollectionPageModal
        isOpen={isPageCreateModalOpen}
        onClose={onPageCreateModalClose}
        siteId={siteId}
        collectionId={resourceId}
      />
      <DeleteResourceModal siteId={siteId} />
      <FolderSettingsModal />
      <PageSettingsModal />
    </>
  )
}

CollectionResourceListPage.getLayout = (page) => {
  return (
    <PermissionsBoundary
      resourceType={ResourceType.Collection}
      page={AdminCmsSearchableLayout(page)}
    />
  )
}

export default CollectionResourceListPage
