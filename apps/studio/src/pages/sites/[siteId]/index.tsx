import {
  Box,
  HStack,
  MenuButton,
  MenuList,
  Portal,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react"
import { Button, Menu } from "@opengovsg/design-system-react"
import { BiData, BiFileBlank, BiFolder } from "react-icons/bi"
import { z } from "zod"

import { MenuItem } from "~/components/Menu"
import { ResourceTable } from "~/features/dashboard/components/ResourceTable"
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

  const { siteId } = useQueryParse(sitePageSchema)

  return (
    <>
      <VStack w="100%" p="1.75rem" gap="1rem">
        <VStack w="100%" align="start">
          <Text textColor="base.content.default" textStyle="h5">
            My Pages
          </Text>
          <HStack w="100%" justify="space-between" align="center" gap={0}>
            <Box />
            <Menu isLazy size="sm">
              <MenuButton as={Button} size="md" justifySelf="flex-end">
                Create new...
              </MenuButton>
              <Portal>
                <MenuList>
                  <MenuItem
                    onClick={onFolderCreateModalOpen}
                    icon={<BiFolder fontSize="1rem" />}
                  >
                    Folder
                  </MenuItem>
                  <MenuItem
                    onClick={onPageCreateModalOpen}
                    icon={<BiFileBlank fontSize="1rem" />}
                  >
                    Page
                  </MenuItem>
                  <MenuItem icon={<BiData fontSize="1rem" />}>
                    Collection
                  </MenuItem>
                </MenuList>
              </Portal>
            </Menu>
          </HStack>
        </VStack>
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
      <MoveResourceModal />
    </>
  )
}

SitePage.getLayout = AdminCmsSidebarLayout
export default SitePage
