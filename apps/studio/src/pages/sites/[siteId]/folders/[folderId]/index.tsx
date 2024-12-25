import NextLink from "next/link"
import {
  Box,
  BreadcrumbItem,
  BreadcrumbLink,
  Flex,
  HStack,
  Portal,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react"
import { Breadcrumb, Button, Menu } from "@opengovsg/design-system-react"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { useSetAtom } from "jotai"
import { BiFileBlank, BiFolder } from "react-icons/bi"
import { z } from "zod"

import type { RouterOutput } from "~/utils/trpc"
import { PermissionsBoundary } from "~/components/AuthWrappers"
import { folderSettingsModalAtom } from "~/features/dashboard/atoms"
import { DeleteResourceModal } from "~/features/dashboard/components/DeleteResourceModal/DeleteResourceModal"
import { FolderSettingsModal } from "~/features/dashboard/components/FolderSettingsModal"
import { PageSettingsModal } from "~/features/dashboard/components/PageSettingsModal"
import { ResourceTable } from "~/features/dashboard/components/ResourceTable"
import { CreateFolderModal } from "~/features/editing-experience/components/CreateFolderModal"
import { CreatePageModal } from "~/features/editing-experience/components/CreatePageModal"
import { MoveResourceModal } from "~/features/editing-experience/components/MoveResourceModal"
import { useQueryParse } from "~/hooks/useQueryParse"
import { type NextPageWithLayout } from "~/lib/types"
import { AdminCmsSearchableLayout } from "~/templates/layouts/AdminCmsSidebarLayout"
import { trpc } from "~/utils/trpc"

const folderPageSchema = z.object({
  siteId: z.string(),
  folderId: z.string(),
})

const getFolderHref = (siteId: string, folderId: string) => {
  return `/sites/${siteId}/folders/${folderId}`
}

/**
 * NOTE: This returns the path from root down to the parent of the element.
 * The element at index 0 is always the root
 * and the last element is always the parent of the current folder
 */
const getBreadcrumbsFrom = (
  resource: RouterOutput["resource"]["getParentOf"],
  siteId: string,
): { href: string; label: string }[] => {
  // NOTE: We only consider the 3 cases below:
  // Root -> Folder
  // Root -> Parent -> Folder
  // Root -> ... -> Parent -> Folder
  const rootHref = `/sites/${siteId}`

  if (resource.parent?.parentId) {
    return [
      { href: rootHref, label: "Home" },
      {
        href: getFolderHref(siteId, resource.parent.parentId),
        label: "...",
      },
      {
        href: getFolderHref(siteId, resource.parent.id),
        label: resource.parent.title,
      },
    ]
  }

  if (resource.parent?.id) {
    return [
      { href: rootHref, label: "Home" },
      {
        href: getFolderHref(siteId, resource.parent.id),
        label: resource.parent.title,
      },
    ]
  }

  return [{ href: rootHref, label: "Home" }]
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
  const [resource] = trpc.resource.getParentOf.useSuspenseQuery({
    siteId: Number(siteId),
    resourceId: folderId,
  })

  const [{ title }] = trpc.folder.getMetadata.useSuspenseQuery({
    siteId: parseInt(siteId),
    resourceId: parseInt(folderId),
  })

  const breadcrumbs = getBreadcrumbsFrom(resource, siteId)

  return (
    <>
      <VStack
        w="100%"
        p="1.75rem"
        gap="1rem"
        height="0"
        overflow="auto"
        minH="100%"
      >
        <VStack w="100%" align="start">
          <Breadcrumb size="sm" w="100%">
            {breadcrumbs.map(({ href, label }, index) => {
              return (
                <BreadcrumbItem key={index}>
                  <BreadcrumbLink href={href} as={NextLink}>
                    <Text
                      textStyle="caption-2"
                      color="interaction.links.default"
                      noOfLines={1}
                      w="max-content"
                    >
                      {label}
                    </Text>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              )
            })}
            <BreadcrumbItem
              key={folderId}
              overflow="hidden"
              whiteSpace="nowrap"
            >
              <Text
                textStyle="caption-2"
                color="base.content.default"
                overflow="hidden"
                textOverflow="ellipsis"
              >
                {title}
              </Text>
            </BreadcrumbItem>
          </Breadcrumb>
          <Flex w="full" flexDir="row">
            <HStack mr="1.25rem" overflow="auto" gap="0.75rem" flex={1}>
              <Box
                aria-hidden
                bg="brand.secondary.100"
                p="0.5rem"
                borderRadius="6px"
              >
                <BiFolder />
              </Box>
              <Text
                noOfLines={1}
                as="h3"
                textStyle="h3"
                textOverflow="ellipsis"
                wordBreak="break-all"
              >
                {title}
              </Text>
            </HStack>

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
        folderId={parseInt(folderId)}
      />
      <CreateFolderModal
        isOpen={isFolderCreateModalOpen}
        onClose={onFolderCreateModalClose}
        siteId={parseInt(siteId)}
        parentFolderId={parseInt(folderId)}
      />
      <FolderSettingsModal />
      <MoveResourceModal />
      <PageSettingsModal />
      <DeleteResourceModal siteId={parseInt(siteId)} />
    </>
  )
}

FolderPage.getLayout = (page) => {
  return (
    <PermissionsBoundary
      resourceType={ResourceType.Folder}
      page={AdminCmsSearchableLayout(page)}
    />
  )
}
export default FolderPage
