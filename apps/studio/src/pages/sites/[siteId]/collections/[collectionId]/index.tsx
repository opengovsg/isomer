import { useDisclosure } from "@chakra-ui/react"
import { Button } from "@opengovsg/oui"
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
import { DeleteResourceModal } from "~/features/dashboard/components/DeleteResourceModal"
import { FolderSettingsModal } from "~/features/dashboard/components/FolderSettingsModal"
import { GazetteCollectionBanner } from "~/features/dashboard/components/GazetteCollectionBanner"
import { IndexpageRow } from "~/features/dashboard/components/IndexpageRow/IndexpageRow"
import { PageSettingsModal } from "~/features/dashboard/components/PageSettingsModal"
import { CreateCollectionPageModal } from "~/features/editing-experience/components/CreateCollectionPageModal"
import { MoveResourceModal } from "~/features/editing-experience/components/MoveResourceModal"
import { useEgazetteInfo } from "~/hooks/useEgazetteInfo"
import { useQueryParse } from "~/hooks/useQueryParse"
import { type NextPageWithLayout } from "~/lib/types"
import { SiteEditorLayout } from "~/templates/layouts/SiteEditorLayout"
import { getCollectionHref } from "~/utils/resource"
import { trpc } from "~/utils/trpc"
import { ResourceType } from "~prisma/generated/generatedEnums"

const collectionPageSchema = z.object({
  siteId: z.coerce.number(),
  collectionId: z.coerce.number(),
})

const CollectionResourceListPage: NextPageWithLayout = () => {
  const {
    isOpen: isPageCreateModalOpen,
    onOpen: onPageCreateModalOpen,
    onClose: onPageCreateModalClose,
  } = useDisclosure()
  const { siteId, collectionId } = useQueryParse(collectionPageSchema)
  const setFolderSettingsModalState = useSetAtom(folderSettingsModalAtom)
  const egazetteInfo = useEgazetteInfo()
  const isEgazetteCollection =
    egazetteInfo.isConfigured &&
    egazetteInfo.siteId === String(siteId) &&
    egazetteInfo.gazettesCollectionId === String(collectionId)

  const [resource] = trpc.resource.getParentOf.useSuspenseQuery({
    siteId: Number(siteId),
    resourceId: String(collectionId),
  })

  const [metadata] = trpc.collection.getMetadata.useSuspenseQuery({
    siteId,
    resourceId: collectionId,
  })

  return (
    <>
      <DashboardLayout
        breadcrumbs={getBreadcrumbsFromRoot(resource, String(siteId)).concat({
          href: getCollectionHref(String(siteId), String(collectionId)),
          label: metadata.title,
        })}
        icon={<BiData />}
        title={metadata.title}
        buttons={
          <>
            <Button
              variant="outline"
              size="md"
              onPress={() =>
                setFolderSettingsModalState({
                  folderId: String(collectionId),
                })
              }
            >
              Collection settings
            </Button>
            <Button onPress={onPageCreateModalOpen} size="md">
              Add new item
            </Button>
          </>
        }
      >
        {isEgazetteCollection ? (
          <GazetteCollectionBanner />
        ) : (
          <CollectionBanner />
        )}
        <IndexpageRow
          type="collection"
          siteId={siteId}
          resourceId={String(collectionId)}
        />
        <CollectionTable resourceId={collectionId} siteId={siteId} />
      </DashboardLayout>
      <CreateCollectionPageModal
        isOpen={isPageCreateModalOpen}
        onClose={onPageCreateModalClose}
        siteId={siteId}
        collectionId={collectionId}
      />
      <DeleteResourceModal siteId={siteId} />
      <FolderSettingsModal />
      <PageSettingsModal />
      <MoveResourceModal />
    </>
  )
}

CollectionResourceListPage.getLayout = (page) => {
  return (
    <PermissionsBoundary
      resourceType={ResourceType.Collection}
      page={SiteEditorLayout(page)}
    />
  )
}

export default CollectionResourceListPage
