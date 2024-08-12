import {
  Box,
  BreadcrumbItem,
  BreadcrumbLink,
  Flex,
  HStack,
  MenuButton,
  MenuList,
  Portal,
  Spacer,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react"
import { Breadcrumb, Button, Menu } from "@opengovsg/design-system-react"
import { BiData, BiFileBlank, BiFolder } from "react-icons/bi"
import { z } from "zod"

import { MenuItem } from "~/components/Menu"
import { FolderSettingsModal } from "~/features/dashboard/components/FolderSettingsModal"
import { ResourceTable } from "~/features/dashboard/components/ResourceTable"
import { CreateFolderModal } from "~/features/editing-experience/components/CreateFolderModal"
import { CreatePageModal } from "~/features/editing-experience/components/CreatePageModal"
import { useQueryParse } from "~/hooks/useQueryParse"
import { type NextPageWithLayout } from "~/lib/types"
import { AdminCmsSidebarLayout } from "~/templates/layouts/AdminCmsSidebarLayout"
import { trpc } from "~/utils/trpc"

const folderPageSchema = z.object({
  siteId: z.string(),
  folderId: z.string(),
})

const FolderPage: NextPageWithLayout = () => {
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
    isOpen: isFolderSettingsModalOpen,
    onOpen: onFolderSettingsModalOpen,
    onClose: onFolderSettingsModalClose,
  } = useDisclosure()

  const { folderId, siteId } = useQueryParse(folderPageSchema)

  const [{ title, permalink }] = trpc.folder.readFolder.useSuspenseQuery({
    siteId: parseInt(siteId),
    resourceId: parseInt(folderId),
  })

  return (
    <>
      <VStack w="100%" p="1.75rem" gap="1rem">
        <VStack w="100%" align="start">
          <Breadcrumb size="sm">
            <BreadcrumbItem>
              <BreadcrumbLink isCurrentPage href={permalink}>
                <Text color="base.content.default">{title}</Text>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>
          <Flex w="full" flexDir="row">
            <HStack gap="0.75rem" flex={1}>
              <Box
                aria-hidden
                bg="brand.secondary.100"
                p="0.5rem"
                borderRadius="6px"
              >
                <BiData />
              </Box>
              <Text textStyle="h3">{title}</Text>
            </HStack>

            <Spacer />

            <HStack>
              <Button
                variant="outline"
                size="md"
                onClick={onFolderSettingsModalOpen}
              >
                Folder settings
              </Button>
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
                  </MenuList>
                </Portal>
              </Menu>
            </HStack>
          </Flex>
          <HStack w="100%" justify="space-between" align="center" gap={0}>
            <Box />
          </HStack>
        </VStack>
        <Box width="100%">
          <ResourceTable
            siteId={parseInt(siteId)}
            resourceId={parseInt(folderId)}
          />
        </Box>
      </VStack>
      <CreatePageModal
        isOpen={isPageCreateModalOpen}
        onClose={onPageCreateModalClose}
        siteId={parseInt(siteId)}
      />
      <CreateFolderModal
        isOpen={isFolderCreateModalOpen}
        onClose={onFolderCreateModalClose}
        siteId={parseInt(siteId)}
      />
      <FolderSettingsModal
        isOpen={isFolderSettingsModalOpen}
        onClose={onFolderSettingsModalClose}
        siteId={siteId}
        resourceId={parseInt(folderId)}
      />
    </>
  )
}

FolderPage.getLayout = AdminCmsSidebarLayout
export default FolderPage
