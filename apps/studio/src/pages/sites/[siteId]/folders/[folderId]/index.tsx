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
import { uniqueId } from "lodash"
import { BiData, BiFileBlank, BiFolder } from "react-icons/bi"
import { z } from "zod"

import { MenuItem } from "~/components/Menu"
import { ResourceTable } from "~/features/dashboard/components/ResourceTable"
import { CreateFolderModal } from "~/features/editing-experience/components/CreateFolderModal"
import { CreatePageModal } from "~/features/editing-experience/components/CreatePageModal"
import { useQueryParse } from "~/hooks/useQueryParse"
import { type NextPageWithLayout } from "~/lib/types"
import { AdminCmsSidebarLayout } from "~/templates/layouts/AdminCmsSidebarLayout"
import { trpc } from "~/utils/trpc"

const folderPageSchema = z.object({
  siteId: z.coerce.number(),
  folderId: z.coerce.number(),
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

  const { folderId, siteId } = useQueryParse(folderPageSchema)

  const [{ title, permalink, children, parentId }] =
    trpc.folder.readFolder.useSuspenseQuery({
      siteId,
      resourceId: folderId,
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
              <Button variant="outline" size="md">
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
          <ResourceTable siteId={siteId} resourceId={folderId} />
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
        key={uniqueId()}
      />
    </>
  )
}

FolderPage.getLayout = AdminCmsSidebarLayout
export default FolderPage
