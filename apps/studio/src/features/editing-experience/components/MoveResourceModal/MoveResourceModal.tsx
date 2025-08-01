import { useEffect, useState } from "react"
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

    const movedItem = useAtomValue(moveResourceAtom)

    const moveResourceMutation = trpc.resource.move.useMutation()

    useEffect(() => {
      if (moveResourceMutation.isSuccess || moveResourceMutation.isError) {
        // TODO: actually close the modal
        setMovedItem(null)
      }
    }, [
      moveResourceMutation.isSuccess,
      moveResourceMutation.isError,
      setMovedItem,
    ])

    useEffect(() => {
      if (moveResourceMutation.isSuccess) {
        void utils.collection.list.invalidate()
        void utils.page.readPageAndBlob.invalidate()
        void utils.resource.getParentOf.invalidate()
        void utils.resource.getFolderChildrenOf.invalidate()
        void utils.resource.getChildrenOf.invalidate()
        void utils.resource.getAncestryStack.invalidate()
        void utils.resource.getBatchAncestryWithSelf.invalidate()
        void utils.resource.countWithoutRoot.invalidate({
          // TODO: Update backend `list` to use the proper schema
          resourceId: curResourceId ? Number(curResourceId) : undefined,
        })
        void utils.resource.countWithoutRoot.invalidate({
          // TODO: Update backend `list` to use the proper schema
          resourceId: movedItem?.parentId
            ? Number(movedItem.parentId)
            : undefined,
        })
        void utils.resource.listWithoutRoot.invalidate({
          // TODO: Update backend `list` to use the proper schema
          resourceId: curResourceId ? Number(curResourceId) : undefined,
        })
        void utils.resource.listWithoutRoot.invalidate({
          // TODO: Update backend `list` to use the proper schema
          resourceId: movedItem?.parentId
            ? Number(movedItem.parentId)
            : undefined,
        })
        // NOTE: We might want to have smarter logic here
        // and invalidate the new + old folders
        void utils.folder.getMetadata.invalidate()
        void utils.resource.getMetadataById.invalidate({
          resourceId: movedItem?.id,
        })
        toast({ title: "Resource moved!", ...BRIEF_TOAST_SETTINGS })
      }
    }, [
      moveResourceMutation.isSuccess,
      utils,
      onClose,
      toast,
      curResourceId,
      movedItem,
    ])

    useEffect(() => {
      if (moveResourceMutation.isError) {
        toast({
          title: "Failed to move resource",
          status: "error",
          description: moveResourceMutation.error.message,
          ...BRIEF_TOAST_SETTINGS,
        })
      }
    }, [moveResourceMutation.isError, moveResourceMutation.error, toast])

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
            isLoading={moveResourceMutation.isPending}
            onClick={() =>
              movedItem?.id &&
              moveResourceMutation.mutate({
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
