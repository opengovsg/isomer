import { useDisclosure } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { useSetAtom } from "jotai"
import { BiData } from "react-icons/bi"
import { z } from "zod"

import type { RouterOutput } from "~/utils/trpc"
import { PermissionsBoundary } from "~/components/AuthWrappers"
import { folderSettingsModalAtom } from "~/features/dashboard/atoms"
import { CollectionBanner } from "~/features/dashboard/components/CollectionBanner"
import { CollectionTable } from "~/features/dashboard/components/CollectionTable"
import { DashboardLayout } from "~/features/dashboard/components/DashboardLayout"
import { DeleteResourceModal } from "~/features/dashboard/components/DeleteResourceModal/DeleteResourceModal"
import { FolderSettingsModal } from "~/features/dashboard/components/FolderSettingsModal"
import { PageSettingsModal } from "~/features/dashboard/components/PageSettingsModal"
import { CreateCollectionPageModal } from "~/features/editing-experience/components/CreateCollectionPageModal"
import { useQueryParse } from "~/hooks/useQueryParse"
import { type NextPageWithLayout } from "~/lib/types"
import { AdminCmsSearchableLayout } from "~/templates/layouts/AdminCmsSidebarLayout"
import { getCollectionHref, getFolderHref, getRootHref } from "~/utils/resource"
import { trpc } from "~/utils/trpc"
import { ResourceType } from "../../../../../prisma/generated/generatedEnums"

const sitePageSchema = z.object({
  siteId: z.coerce.number(),
  resourceId: z.coerce.number(),
})

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
  const rootHref = getRootHref(siteId)

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
        breadcrumbs={getBreadcrumbsFrom(resource, String(siteId)).concat({
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
