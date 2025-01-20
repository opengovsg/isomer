import { useState } from "react"
import {
  Box,
  Button,
  Flex,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Skeleton,
  Spacer,
  Text,
  VStack,
} from "@chakra-ui/react"
import { Infobox, Link, useToast } from "@opengovsg/design-system-react"
import { useAtom, useAtomValue, useSetAtom } from "jotai"
import { BiHomeAlt, BiLeftArrowAlt } from "react-icons/bi"

import type { PendingMoveResource } from "../../types"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { usePermissions } from "~/features/permissions"
import { withSuspense } from "~/hocs/withSuspense"
import { useQueryParse } from "~/hooks/useQueryParse"
import { sitePageSchema } from "~/pages/sites/[siteId]"
import { trpc } from "~/utils/trpc"
import { moveResourceAtom, moveTypesAtom } from "../../atoms"
import { MoveItem } from "./MoveItem"

const generatePermalinkPrefix = (parents: PendingMoveResource[]) => {
  return parents.map((parent) => parent.permalink).join("/")
}

export const MoveResourceModal = () => {
  // NOTE: This is what we are trying to move
  const [moveItem, setMoveItem] = useAtom(moveResourceAtom)
  const onClose = () => setMoveItem(null)

  return (
    <Modal isOpen={!!moveItem} onClose={onClose}>
      <ModalOverlay />
      {moveItem && (
        <MoveResourceContent
          onClose={onClose}
          resourceId={moveItem.resourceId}
        />
      )}
    </Modal>
  )
}

const MoveResourceContent = withSuspense(
  ({ resourceId, onClose }: { resourceId: string; onClose: () => void }) => {
    // NOTE: This is the stack of user's navigation through the resource tree
    // NOTE: We should always start the stack from `/` (root)
    // so that the user will see a full overview of their site structure
    const [resourceStack, setResourceStack] = useState<PendingMoveResource[]>(
      [],
    )
    const allowedMoveTypes = useAtomValue(moveTypesAtom)
    const [isResourceHighlighted, setIsResourceHighlighted] =
      useState<boolean>(true)
    const { siteId } = useQueryParse(sitePageSchema)
    const setMovedItem = useSetAtom(moveResourceAtom)
    const [{ title }] = trpc.resource.getMetadataById.useSuspenseQuery({
      resourceId,
    })
    const moveDest = resourceStack[resourceStack.length - 1]
    const parentDest = resourceStack[resourceStack.length - 2]
    const curResourceId = moveDest?.resourceId
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
      trpc.resource.getChildrenOf.useInfiniteQuery(
        {
          resourceId:
            (isResourceHighlighted
              ? parentDest?.resourceId
              : moveDest?.resourceId) ?? null,
          siteId: String(siteId),
          limit: 25,
        },
        {
          getNextPageParam: (lastPage) => lastPage.nextOffset,
        },
      )
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
        await utils.resource.getChildrenOf.invalidate()
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
          resourceId: movedItem?.resourceId,
        })
        toast({ title: "Resource moved!", ...BRIEF_TOAST_SETTINGS })
      },
    })

    const movedItem = useAtomValue(moveResourceAtom)

    const shouldShowBackButton: boolean =
      (resourceStack.length === 1 && !isResourceHighlighted) ||
      resourceStack.length > 1

    return (
      <ModalContent>
        <ModalHeader mr="3.5rem">Move "{title}" to...</ModalHeader>
        <ModalCloseButton size="lg" />
        <ModalBody>
          <VStack alignItems="flex-start" spacing="1.25rem">
            <Infobox size="sm" w="full">
              Moving a page or folder changes its URL, effective immediately
            </Infobox>
            <Box
              borderRadius="md"
              border="1px solid"
              borderColor="base.divider.strong"
              w="full"
              py="0.75rem"
              px="0.5rem"
            >
              {shouldShowBackButton ? (
                <Link
                  variant="clear"
                  w="full"
                  justifyContent="flex-start"
                  color="base.content.default"
                  onClick={() => {
                    if (isResourceHighlighted) {
                      setIsResourceHighlighted(false)
                      setResourceStack((prev) => prev.slice(0, -2))
                    } else {
                      setResourceStack((prev) => prev.slice(0, -1))
                    }
                  }}
                  as="button"
                >
                  <HStack spacing="0.25rem" color="interaction.links.default">
                    <BiLeftArrowAlt />
                    <Text textStyle="caption-1">Back to parent folder</Text>
                  </HStack>
                </Link>
              ) : (
                <Flex
                  w="full"
                  py="0.75rem"
                  px="0.5rem"
                  color="base.content.default"
                  alignItems="center"
                >
                  <HStack spacing="0.25rem">
                    <BiHomeAlt />
                    <Text textStyle="caption-1">/</Text>
                  </HStack>
                  <Spacer />
                  <Text
                    color="base.content.medium"
                    textTransform="uppercase"
                    textStyle="caption-1"
                    overflow="hidden"
                    textOverflow="ellipsis"
                    whiteSpace="nowrap"
                  >
                    Home
                  </Text>
                </Flex>
              )}
              {data?.pages.map(({ items }) =>
                items
                  .filter(({ type }) => {
                    return allowedMoveTypes.includes(type)
                  })
                  .map((item) => {
                    const isItemDisabled: boolean =
                      item.id === movedItem?.resourceId
                    const isItemHighlighted: boolean =
                      isResourceHighlighted && item.id === curResourceId

                    return (
                      <MoveItem
                        {...item}
                        key={item.id}
                        isDisabled={isItemDisabled}
                        isHighlighted={isItemHighlighted}
                        handleOnClick={() => {
                          if (isItemDisabled) {
                            return
                          }

                          if (isItemHighlighted) {
                            setIsResourceHighlighted(false)
                            return
                          }

                          const newResource = {
                            ...item,
                            parentId: parentDest?.resourceId ?? null,
                            resourceId: item.id,
                          }
                          if (isResourceHighlighted) {
                            setResourceStack((prev) => [
                              ...prev.slice(0, -1),
                              newResource,
                            ])
                          } else {
                            setIsResourceHighlighted(true)
                            setResourceStack((prev) => [...prev, newResource])
                          }
                        }}
                      />
                    )
                  }),
              )}
              {hasNextPage && (
                <Button
                  variant="link"
                  pl="2.25rem"
                  size="xs"
                  isLoading={isFetchingNextPage}
                  onClick={() => fetchNextPage()}
                >
                  Load more
                </Button>
              )}
            </Box>
            {!!moveDest && (
              <Box bg="utility.feedback.info-subtle" p="0.75rem" w="full">
                <Flex flexDirection="column" gap="0.25rem">
                  <Text textStyle="caption-1">
                    You selected {moveDest.permalink}
                  </Text>
                  <Text textStyle="caption-2">
                    The URL for {movedItem?.title} will change to{" "}
                    {`${generatePermalinkPrefix(resourceStack)}/${movedItem?.permalink}`}
                  </Text>
                </Flex>
              </Box>
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
              ability.cannot("move", {
                parentId: moveDest?.resourceId ?? null,
              }) ||
              ability.cannot("move", { parentId: movedItem?.parentId ?? null })
            }
            isLoading={isLoading}
            onClick={() =>
              movedItem?.resourceId &&
              mutate({
                siteId,
                movedResourceId: movedItem.resourceId,
                destinationResourceId: moveDest?.resourceId ?? null,
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
