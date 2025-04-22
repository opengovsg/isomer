import { Portal, useDisclosure } from "@chakra-ui/react"
import { Button, Menu } from "@opengovsg/design-system-react"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { useSetAtom } from "jotai"
import { BiData, BiFileBlank, BiFolder } from "react-icons/bi"
import { z } from "zod"

import { PermissionsBoundary } from "~/components/AuthWrappers"
import { folderSettingsModalAtom } from "~/features/dashboard/atoms"
import { AdminCreateIndexPageButton } from "~/features/dashboard/components/AdminCreateIndexPageButton"
import {
  DashboardLayout,
  getBreadcrumbsFromRoot,
} from "~/features/dashboard/components/DashboardLayout"
import { DeleteResourceModal } from "~/features/dashboard/components/DeleteResourceModal/DeleteResourceModal"
import { FolderSettingsModal } from "~/features/dashboard/components/FolderSettingsModal"
import { IndexpageRow } from "~/features/dashboard/components/IndexpageRow/IndexpageRow"
import { PageSettingsModal } from "~/features/dashboard/components/PageSettingsModal"
import { ResourceTable } from "~/features/dashboard/components/ResourceTable"
import { CreateCollectionModal } from "~/features/editing-experience/components/CreateCollectionModal"
import { CreateFolderModal } from "~/features/editing-experience/components/CreateFolderModal"
import { CreatePageModal } from "~/features/editing-experience/components/CreatePageModal"
import { MoveResourceModal } from "~/features/editing-experience/components/MoveResourceModal"
import { useQueryParse } from "~/hooks/useQueryParse"
import { type NextPageWithLayout } from "~/lib/types"
import { AdminCmsSearchableLayout } from "~/templates/layouts/AdminCmsSidebarLayout"
import { getFolderHref } from "~/utils/resource"
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
    isOpen: isCollectionCreateModalOpen,
    onOpen: onCollectionCreateModalOpen,
    onClose: onCollectionCreateModalClose,
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

  return (
    <>
      <DashboardLayout
        breadcrumbs={getBreadcrumbsFromRoot(resource, siteId).concat({
          href: getFolderHref(siteId, folderId),
          label: title,
        })}
        icon={<BiFolder />}
        title={title}
        buttons={
          <>
            <AdminCreateIndexPageButton
              siteId={parseInt(siteId)}
              parentId={parseInt(folderId)}
            />
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
          </>
        }
      >
        <IndexpageRow siteId={Number(siteId)} resourceId={folderId} />
        <ResourceTable
          siteId={parseInt(siteId)}
          resourceId={parseInt(folderId)}
        />
      </DashboardLayout>
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
      <CreateCollectionModal
        isOpen={isCollectionCreateModalOpen}
        onClose={onCollectionCreateModalClose}
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
