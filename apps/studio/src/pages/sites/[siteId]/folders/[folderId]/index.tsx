import { useDisclosure } from "@chakra-ui/react"
import { Button, Menu, MenuItem, MenuTrigger } from "@opengovsg/oui"
import { useSetAtom } from "jotai"
import { BiChevronDown, BiData, BiFileBlank, BiFolder } from "react-icons/bi"
import { z } from "zod"
import { PermissionsBoundary } from "~/components/AuthWrappers"
import { folderSettingsModalAtom } from "~/features/dashboard/atoms"
import {
  DashboardLayout,
  getBreadcrumbsFromRoot,
} from "~/features/dashboard/components/DashboardLayout"
import { DeleteResourceModal } from "~/features/dashboard/components/DeleteResourceModal"
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
import { SiteEditorLayout } from "~/templates/layouts/SiteEditorLayout"
import { getFolderHref } from "~/utils/resource"
import { trpc } from "~/utils/trpc"
import { ResourceType } from "~prisma/generated/generatedEnums"

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
            <Button
              variant="outline"
              size="md"
              onPress={() =>
                setFolderSettingsModalState({
                  folderId,
                })
              }
            >
              Folder settings
            </Button>
            <MenuTrigger>
              <Button
                size="md"
                className="justify-self-end"
                endContent={
                  <BiChevronDown className="size-5 transition-transform group-aria-expanded:rotate-180" />
                }
              >
                Create new...
              </Button>
              <Menu size="sm">
                <MenuItem
                  onAction={onFolderCreateModalOpen}
                  startContent={<BiFolder className="size-4" />}
                >
                  Folder
                </MenuItem>
                <MenuItem
                  onAction={onPageCreateModalOpen}
                  startContent={<BiFileBlank className="size-4" />}
                >
                  Page
                </MenuItem>
                <MenuItem
                  onAction={onCollectionCreateModalOpen}
                  startContent={<BiData className="size-4" />}
                >
                  Collection
                </MenuItem>
              </Menu>
            </MenuTrigger>
          </>
        }
      >
        <IndexpageRow
          type="folder"
          siteId={Number(siteId)}
          resourceId={folderId}
        />
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
      page={SiteEditorLayout(page)}
    />
  )
}
export default FolderPage
