import { useDisclosure } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { useSetAtom } from "jotai"
import { BiData } from "react-icons/bi"
import { z } from "zod"

import { PermissionsBoundary } from "~/components/AuthWrappers"
import { folderSettingsModalAtom } from "~/features/dashboard/atoms"
import { CollectionBanner } from "~/features/dashboard/components/CollectionBanner"
import { CollectionTable } from "~/features/dashboard/components/CollectionTable"
import {
  DashboardLayout,
  getBreadcrumbsFromRoot,
} from "~/features/dashboard/components/DashboardLayout"
import { DeleteResourceModal } from "~/features/dashboard/components/DeleteResourceModal/DeleteResourceModal"
import { FolderSettingsModal } from "~/features/dashboard/components/FolderSettingsModal"
import { PageSettingsModal } from "~/features/dashboard/components/PageSettingsModal"
import { CreateCollectionPageModal } from "~/features/editing-experience/components/CreateCollectionPageModal"
import { useQueryParse } from "~/hooks/useQueryParse"
import { type NextPageWithLayout } from "~/lib/types"
import { AdminCmsSearchableLayout } from "~/templates/layouts/AdminCmsSidebarLayout"
import { getCollectionHref } from "~/utils/resource"
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

  const [resource] = trpc.resource.getParentOf.useSuspenseQuery({
    siteId: Number(siteId),
    resourceId: String(resourceId),
  })

  // TODO: Handle not found error in error boundary
  const [metadata] = trpc.collection.getMetadata.useSuspenseQuery({
    siteId,
    resourceId,
  })

  return (
    <>
      <DashboardLayout
        breadcrumbs={getBreadcrumbsFromRoot(resource, String(siteId)).concat({
          href: getCollectionHref(String(siteId), String(resourceId)),
          label: metadata.title,
        })}
        icon={<BiData />}
        title={metadata.title}
        buttons={
          <>
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
          </>
        }
      >
        <CollectionBanner />
        <CollectionTable resourceId={resourceId} siteId={siteId} />
      </DashboardLayout>
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
