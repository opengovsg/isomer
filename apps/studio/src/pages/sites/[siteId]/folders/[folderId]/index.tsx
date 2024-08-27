import {
  Box,
  BreadcrumbItem,
  BreadcrumbLink,
  Flex,
  HStack,
  Portal,
  Spacer,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react"
import { Breadcrumb, Button, Menu } from "@opengovsg/design-system-react"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { useSetAtom } from "jotai"
import { BiFileBlank, BiFolder } from "react-icons/bi"
import { z } from "zod"

import { folderSettingsModalAtom } from "~/features/dashboard/atoms"
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
const getResourceLink = (
  resourceId: string | undefined,
  siteId: number,
  resourceType: ResourceType,
) => {
  if (resourceType === ResourceType.RootPage) {
    return `/sites/${siteId}`
  }

  return `/sites/${siteId}/folders/${resourceId}`
}

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
  const setFolderSettingsModalState = useSetAtom(folderSettingsModalAtom)

  const { folderId, siteId } = useQueryParse(folderPageSchema)
  const [{ parentResourceId, resourceType }] =
    trpc.resource.getParentOf.useSuspenseQuery({
      siteId: Number(siteId),
      resourceId: folderId,
    })

  const [{ title }] = trpc.folder.getMetadata.useSuspenseQuery({
    siteId: parseInt(siteId),
    resourceId: parseInt(folderId),
  })

  const parentLinkHref = getResourceLink(
    parentResourceId,
    Number(siteId),
    resourceType,
  )

  return (
    <>
      <VStack w="100%" p="1.75rem" gap="1rem">
        <VStack w="100%" align="start">
          <Breadcrumb size="sm">
            <BreadcrumbItem>
              <BreadcrumbLink href={`/sites/${siteId}`}>
                <Text textStyle="caption-2" color="interaction.links.default">
                  Home
                </Text>
              </BreadcrumbLink>
            </BreadcrumbItem>
            {parentResourceId && (
              <BreadcrumbItem>
                <BreadcrumbLink href={parentLinkHref}>
                  <Text textStyle="caption-2" color="base.content.default">
                    ...
                  </Text>
                </BreadcrumbLink>
              </BreadcrumbItem>
            )}
            <BreadcrumbItem>
              <BreadcrumbLink
                isCurrentPage
                href={`/sites/${siteId}/folders/${folderId}`}
              >
                <Text textStyle="caption-2" color="base.content.default">
                  {title}
                </Text>
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
                <BiFolder />
              </Box>
              <Text noOfLines={1} as="h3" textStyle="h3">
                {title}
              </Text>
            </HStack>

            <Spacer />

            <HStack>
              <Button
                variant="outline"
                size="md"
                onClick={() =>
                  setFolderSettingsModalState({
                    folderId,
                  })
                }
              >
                Folder settings
              </Button>
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
                      </Menu.List>
                    </Portal>
                  </>
                )}
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
        parentFolderId={parseInt(folderId)}
      />
      <FolderSettingsModal />
    </>
  )
}

FolderPage.getLayout = AdminCmsSidebarLayout
export default FolderPage
