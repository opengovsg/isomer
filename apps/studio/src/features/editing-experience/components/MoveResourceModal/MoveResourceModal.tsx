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
import { withSuspense } from "~/hocs/withSuspense"
import { useQueryParse } from "~/hooks/useQueryParse"
import { sitePageSchema } from "~/pages/sites/[siteId]"
import { trpc } from "~/utils/trpc"
import { moveResourceAtom } from "../../atoms"
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
    // the last item here represents his current view
    // NOTE: We should always start the stack from `/` (root)
    // so that the user will see a full overview of their site structure
    const [resourceStack, setResourceStack] = useState<PendingMoveResource[]>(
      [],
    )
    const [selectedResourceId, setSelectedResourceId] = useState<string | null>(
      null,
    )
    const moveDest = resourceStack[resourceStack.length - 1]
    const { siteId } = useQueryParse(sitePageSchema)
    const setMovedItem = useSetAtom(moveResourceAtom)
    const [{ title }] = trpc.resource.getMetadataById.useSuspenseQuery({
      resourceId,
    })
    const curResourceId = resourceStack[resourceStack.length - 1]?.resourceId
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
      trpc.resource.getFolderChildrenOf.useInfiniteQuery(
        {
          resourceId: curResourceId ?? null,
          siteId: String(siteId),
          limit: 25,
        },
        {
          getNextPageParam: (lastPage) => lastPage.nextOffset,
        },
      )
    const utils = trpc.useUtils()
    const toast = useToast({ status: "success" })
    const { mutate, isLoading } = trpc.resource.move.useMutation({
      onError: (err) => {
        toast({
          title: "Failed to move resource",
          status: "error",
          description: err.message,
        })
      },
      onSettled: () => {
        // TODO: actually close the modal
        setMovedItem(null)
      },
      onSuccess: async () => {
        await utils.page.readPageAndBlob.invalidate()
        await utils.resource.getParentOf.invalidate()
        await utils.resource.getChildrenOf.invalidate()
        await utils.resource.countWithoutRoot.invalidate({
          // TODO: Update backend `list` to use the proper schema
          resourceId: moveDest?.resourceId
            ? Number(moveDest.resourceId)
            : undefined,
        })
        await utils.resource.countWithoutRoot.invalidate({
          // TODO: Update backend `list` to use the proper schema
          resourceId: movedItem?.parentId
            ? Number(movedItem.parentId)
            : undefined,
        })
        await utils.resource.listWithoutRoot.invalidate({
          // TODO: Update backend `list` to use the proper schema
          resourceId: moveDest?.resourceId
            ? Number(moveDest.resourceId)
            : undefined,
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
        toast({ title: "Resource moved!" })
      },
    })

    const movedItem = useAtomValue(moveResourceAtom)
    const onBack = () => {
      setResourceStack((prev) => prev.slice(0, -1))
    }

    return (
      <ModalContent>
        <ModalHeader>Move "{title}" to...</ModalHeader>
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
              {resourceStack.length > 0 ? (
                <Link
                  variant="clear"
                  w="full"
                  justifyContent="flex-start"
                  color="base.content.default"
                  onClick={onBack}
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
                items.map((child) => {
                  return (
                    <MoveItem
                      {...child}
                      isDisabled={child.id === movedItem?.resourceId}
                      key={child.id}
                      onChangeResourceId={() => {
                        setResourceStack((prev) => [
                          ...prev,
                          {
                            ...child,
                            parentId: curResourceId ?? null,
                            resourceId: child.id,
                          },
                        ])
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
            // NOTE: disable this button if either resourceId is missing
            isDisabled={!moveDest?.resourceId || !movedItem?.resourceId}
            isLoading={isLoading}
            onClick={() =>
              movedItem?.resourceId &&
              moveDest?.resourceId &&
              mutate({
                movedResourceId: movedItem.resourceId,
                destinationResourceId: moveDest.resourceId,
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
