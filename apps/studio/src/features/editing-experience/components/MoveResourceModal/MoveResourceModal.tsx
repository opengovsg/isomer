import { useState } from "react"
import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Skeleton,
  VStack,
} from "@chakra-ui/react"
import { Infobox, useToast } from "@opengovsg/design-system-react"
import { useAtom, useAtomValue, useSetAtom } from "jotai"

import { ResourceSelector } from "~/components/ResourceSelector/ResourceSelector"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { usePermissions } from "~/features/permissions"
import { withSuspense } from "~/hocs/withSuspense"
import { useQueryParse } from "~/hooks/useQueryParse"
import { sitePageSchema } from "~/pages/sites/[siteId]"
import { trpc } from "~/utils/trpc"
import { moveResourceAtom } from "../../atoms"

export const MoveResourceModal = () => {
  // NOTE: This is what we are trying to move
  const [moveItem, setMoveItem] = useAtom(moveResourceAtom)
  const onClose = () => setMoveItem(null)

  return (
    <Modal isOpen={!!moveItem} onClose={onClose}>
      <ModalOverlay />
      {moveItem && (
        <MoveResourceContent onClose={onClose} resourceId={moveItem.id} />
      )}
    </Modal>
  )
}

const MoveResourceContent = withSuspense(
  ({ resourceId, onClose }: { resourceId: string; onClose: () => void }) => {
    // undefined means that the user has not selected a destination yet
    // because null is a valid resourceId (root page)
    // this is used to disable the move button when the user has not selected a destination
    const [curResourceId, setCurResourceId] = useState<
      string | null | undefined
    >(undefined)
    const { siteId } = useQueryParse(sitePageSchema)
    const setMovedItem = useSetAtom(moveResourceAtom)
    const [{ title }] = trpc.resource.getMetadataById.useSuspenseQuery({
      siteId: Number(siteId),
      resourceId,
    })
    const ability = usePermissions()
    const utils = trpc.useUtils()
    const toast = useToast({ status: "success" })
    const { mutate, isLoading } = trpc.resource.move.useMutation({
      onError: (err) => {
        toast({
          title: "Failed to move resource",
          status: "error",
          description: err.message,
          ...BRIEF_TOAST_SETTINGS,
        })
      },
      onSettled: () => {
        // TODO: actually close the modal
        setMovedItem(null)
      },
      onSuccess: async () => {
        await utils.collection.list.invalidate()
        await utils.page.readPageAndBlob.invalidate()
        await utils.resource.getParentOf.invalidate()
        await utils.resource.getFolderChildrenOf.invalidate()
        await utils.resource.getChildrenOf.invalidate()
        await utils.resource.getAncestryStack.invalidate()
        await utils.resource.getBatchAncestryWithSelf.invalidate()
        await utils.resource.countWithoutRoot.invalidate({
          // TODO: Update backend `list` to use the proper schema
          resourceId: curResourceId ? Number(curResourceId) : undefined,
        })
        await utils.resource.countWithoutRoot.invalidate({
          // TODO: Update backend `list` to use the proper schema
          resourceId: movedItem?.parentId
            ? Number(movedItem.parentId)
            : undefined,
        })
        await utils.resource.listWithoutRoot.invalidate({
          // TODO: Update backend `list` to use the proper schema
          resourceId: curResourceId ? Number(curResourceId) : undefined,
        })
        await utils.resource.listWithoutRoot.invalidate({
          // TODO: Update backend `list` to use the proper schema
          resourceId: movedItem?.parentId
            ? Number(movedItem.parentId)
            : undefined,
        })
        // NOTE: We might want to have smarter logic here
        // and invalidate the new + old folders
        await utils.folder.getMetadata.invalidate()
        await utils.resource.getMetadataById.invalidate({
          resourceId: movedItem?.id,
        })
        toast({ title: "Resource moved!", ...BRIEF_TOAST_SETTINGS })
      },
    })

    const movedItem = useAtomValue(moveResourceAtom)

    return (
      <ModalContent>
        <ModalHeader mr="3.5rem">Move "{title}" to...</ModalHeader>
        <ModalCloseButton size="lg" />
        <ModalBody>
          <VStack alignItems="flex-start" spacing="1.25rem">
            <Infobox size="sm" w="full">
              Moving a page or folder changes its URL, effective immediately
            </Infobox>
            <ResourceSelector
              interactionType="move"
              siteId={siteId}
              onlyShowFolders
              existingResource={movedItem ?? undefined}
              onChange={(resourceId) => setCurResourceId(resourceId)}
            />
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button
            variant="clear"
            mr={3}
            onClick={onClose}
            color="base.content.default"
          >
            Cancel
          </Button>
          <Button
            // NOTE: disable this button if the resourceId to be moved is missing
            // or if the user does not have sufficient permissions to move to the destination
            isDisabled={
              curResourceId === undefined ||
              ability.cannot("move", {
                parentId: curResourceId ?? null,
              }) ||
              ability.cannot("move", { parentId: movedItem?.parentId ?? null })
            }
            isLoading={isLoading}
            onClick={() =>
              movedItem?.id &&
              mutate({
                siteId,
                movedResourceId: movedItem.id,
                destinationResourceId: curResourceId ?? null,
              })
            }
          >
            Move here
          </Button>
        </ModalFooter>
      </ModalContent>
    )
  },
  <Skeleton height="200px" />,
)
