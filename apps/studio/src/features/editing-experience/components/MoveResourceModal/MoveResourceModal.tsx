import {
  Box,
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Skeleton,
  Text,
  VStack,
} from "@chakra-ui/react"
import { Checkbox, Infobox, useToast } from "@opengovsg/design-system-react"
import { useAtom, useAtomValue, useSetAtom } from "jotai"
import { useState } from "react"
import { ResourceSelector } from "~/components/ResourceSelector/ResourceSelector"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { usePermissions } from "~/features/permissions"
import { withSuspense } from "~/hocs/withSuspense"
import { useQueryParse } from "~/hooks/useQueryParse"
import { sitePageSchema } from "~/pages/sites/[siteId]"
import { normalizeRedirectPath } from "~/schemas/redirect"
import { trpc } from "~/utils/trpc"
import { ResourceType } from "~prisma/generated/generatedEnums"

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
    const [{ title, type, permalink: movedSlug, publishedVersionId }] =
      trpc.resource.getMetadataById.useSuspenseQuery({
        siteId: Number(siteId),
        resourceId,
      })
    const ability = usePermissions()
    const utils = trpc.useUtils()
    const toast = useToast({ status: "success" })
    const { mutate, isPending } = trpc.resource.move.useMutation({
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
        toast({
          status: "success",
          title: "Resource moved!",
          ...BRIEF_TOAST_SETTINGS,
        })
      },
    })

    const movedItem = useAtomValue(moveResourceAtom)

    const [shouldCreateRedirect, setShouldCreateRedirect] = useState(true)
    const [{ fullPermalink: movedFullPermalink }] =
      trpc.resource.getWithFullPermalink.useSuspenseQuery({
        siteId: Number(siteId),
        resourceId,
      })
    const { data: destination } = trpc.resource.getWithFullPermalink.useQuery(
      { siteId: Number(siteId), resourceId: curResourceId ?? "" },
      { enabled: !!curResourceId },
    )

    // Only published Page/CollectionPage have a live URL worth preserving — the
    // server skips redirect creation for unpublished pages, so don't offer it.
    const isRedirectableType =
      (type === ResourceType.Page || type === ResourceType.CollectionPage) &&
      publishedVersionId !== null
    const oldFullPermalink = normalizeRedirectPath(movedFullPermalink)
    const newFullPermalink = normalizeRedirectPath(
      `${curResourceId && destination ? destination.fullPermalink : ""}/${movedSlug}`,
    )
    // The new path is known once a destination is picked (the root needs no
    // lookup); until then the computed permalink is provisional.
    const isDestinationResolved =
      curResourceId === null || (curResourceId !== undefined && !!destination)
    // Moving a page into its current parent leaves the URL unchanged, so there's
    // nothing to redirect — only offer the option when the URL actually changes.
    const showRedirectOption =
      isRedirectableType &&
      isDestinationResolved &&
      oldFullPermalink !== newFullPermalink
    const { data: existingRedirect } = trpc.redirect.getBySource.useQuery(
      { siteId: Number(siteId), source: newFullPermalink },
      { enabled: showRedirectOption },
    )

    return (
      <ModalContent>
        <ModalHeader mr="3.5rem">Move "{title}" to...</ModalHeader>
        <ModalCloseButton size="lg" />
        <ModalBody>
          <VStack alignItems="flex-start" spacing="1.25rem">
            <Infobox size="sm" w="full">
              Moving a page, folder, or collection changes its URL, effective
              immediately
            </Infobox>
            <ResourceSelector
              interactionType="move"
              siteId={siteId}
              onlyShowFolders
              existingResource={movedItem ?? undefined}
              onChange={(resourceId) => setCurResourceId(resourceId)}
            />
            {showRedirectOption && (
              <VStack alignItems="flex-start" spacing="0.5rem" w="full">
                {/* Suppressed when the redirect points back at this page —
                    the move auto-clears it, so it won't actually shadow. */}
                {existingRedirect &&
                  existingRedirect.destinationResourceId !==
                    Number(resourceId) && (
                    <Infobox variant="warning" size="sm" w="full">
                      This URL already redirects to{" "}
                      {existingRedirect.destination}. Visitors will end up there
                      instead.
                    </Infobox>
                  )}
                <Box
                  w="full"
                  bg="utility.feedback.info-subtle"
                  borderRadius="0.5rem"
                  p="1rem"
                >
                  <Checkbox
                    alignItems="flex-start"
                    size="1.25rem"
                    isChecked={shouldCreateRedirect}
                    onChange={(e) => setShouldCreateRedirect(e.target.checked)}
                  >
                    <VStack align="flex-start" spacing="0.25rem">
                      <Text textStyle="subhead-2">
                        Redirect page automatically
                      </Text>
                      <Text textStyle="body-2" color="base.content.medium">
                        Check this box to redirect visitors from{" "}
                        {oldFullPermalink} to {newFullPermalink}.
                      </Text>
                    </VStack>
                  </Checkbox>
                </Box>
              </VStack>
            )}
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
            isLoading={isPending}
            onClick={() =>
              movedItem?.id &&
              mutate({
                siteId,
                movedResourceId: movedItem.id,
                destinationResourceId: curResourceId ?? null,
                shouldCreateRedirect,
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
