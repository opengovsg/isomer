import {
  Box,
  Breadcrumb,
  BreadcrumbItem,
  HStack,
  Portal,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react"
import { Button, Menu } from "@opengovsg/design-system-react"
import { BiData, BiFileBlank, BiFolder, BiHomeAlt } from "react-icons/bi"
import { z } from "zod"

import { DeleteResourceModal } from "~/features/dashboard/components/DeleteResourceModal/DeleteResourceModal"
import { FolderSettingsModal } from "~/features/dashboard/components/FolderSettingsModal"
import { ResourceTable } from "~/features/dashboard/components/ResourceTable"
import { RootpageRow } from "~/features/dashboard/components/RootpageRow"
import { CreateCollectionModal } from "~/features/editing-experience/components/CreateCollectionModal"
import { CreateFolderModal } from "~/features/editing-experience/components/CreateFolderModal"
import { CreatePageModal } from "~/features/editing-experience/components/CreatePageModal"
import { MoveResourceModal } from "~/features/editing-experience/components/MoveResourceModal"
import { useQueryParse } from "~/hooks/useQueryParse"
import { type NextPageWithLayout } from "~/lib/types"
import { AdminCmsSidebarLayout } from "~/templates/layouts/AdminCmsSidebarLayout"

export const sitePageSchema = z.object({
  siteId: z.coerce.number(),
})

const SitePage: NextPageWithLayout = () => {
  const {
    isOpen: isPageCreateModalOpen,
    onOpen: onPageCreateModalOpen,
    onClose: onPageCreateModalClose,
  } = useDisclosure()
  const {
    isOpen: isFolderCreateModalOpen,
    onOpen: onFolderCreateModalOpen,
    onClose: onFolderCreateModalClose,
  } = useDisclosure()
  const {
    isOpen: isCollectionCreateModalOpen,
    onOpen: onCollectionCreateModalOpen,
    onClose: onCollectionCreateModalClose,
  } = useDisclosure()

  const { siteId } = useQueryParse(sitePageSchema)

  return (
    <>
      <VStack w="100%" p="1.75rem" gap="1rem" height="$100vh" overflow="auto">
        <VStack w="100%" align="start">
          <Breadcrumb size="sm">
            <BreadcrumbItem>
              <Text textStyle="caption-2" color="base.content.default">
                Home
              </Text>
            </BreadcrumbItem>
          </Breadcrumb>
          <HStack w="100%" justify="space-between" align="center" gap={0}>
            <HStack gap="0.75rem">
              <Box
                aria-hidden
                bg="brand.secondary.100"
                p="0.5rem"
                borderRadius="6px"
              >
                <BiHomeAlt />
              </Box>
              <Text as="h3" textStyle="h3">
                Home
              </Text>
            </HStack>
            <Menu isLazy size="sm">
              {({ isOpen }) => (
                <>
                  <Menu.Button
                    isOpen={isOpen}
                    as={Button}
                    size="md"
                    justifySelf="flex-end"
                  >
                    Create new...
                  </Menu.Button>
                  <Portal>
                    <Menu.List>
                      <Menu.Item
                        onClick={onFolderCreateModalOpen}
                        icon={<BiFolder fontSize="1rem" />}
                      >
                        Folder
                      </Menu.Item>
                      <Menu.Item
                        onClick={onPageCreateModalOpen}
                        icon={<BiFileBlank fontSize="1rem" />}
                      >
                        Page
                      </Menu.Item>
                      <Menu.Item
                        onClick={onCollectionCreateModalOpen}
                        icon={<BiData fontSize="1rem" />}
                      >
                        Collection
                      </Menu.Item>
                    </Menu.List>
                  </Portal>
                </>
              )}
            </Menu>
          </HStack>
        </VStack>
        <RootpageRow siteId={siteId} />
        <Box width="100%">
          <ResourceTable siteId={siteId} />
        </Box>
      </VStack>
      <CreatePageModal
        isOpen={isPageCreateModalOpen}
        onClose={onPageCreateModalClose}
        siteId={siteId}
      />
      <CreateFolderModal
        isOpen={isFolderCreateModalOpen}
        onClose={onFolderCreateModalClose}
        siteId={siteId}
      />
      <CreateCollectionModal
        isOpen={isCollectionCreateModalOpen}
        onClose={onCollectionCreateModalClose}
        siteId={siteId}
      />
      <DeleteResourceModal siteId={siteId} />
      <MoveResourceModal />
      <FolderSettingsModal />
    </>
  )
}

SitePage.getLayout = AdminCmsSidebarLayout
export default SitePage
