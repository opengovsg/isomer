import type { DropResult } from "@hello-pangea/dnd"
import type { IsomerComponent } from "@opengovsg/isomer-components"
import { useCallback, useMemo, useState } from "react"
import { Box, Flex, HStack, Icon, Skeleton, Text, VStack } from "@chakra-ui/react"
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd"
import { Button, Link, useToast } from "@opengovsg/design-system-react"
import isEqual from "lodash/isEqual"
import { BiFile, BiFolder, BiGridVertical } from "react-icons/bi"

import Suspense from "~/components/Suspense"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { useQueryParse } from "~/hooks/useQueryParse"
import { trpc } from "~/utils/trpc"
import { pageSchema } from "../../schema"
import { CHANGES_SAVED_PLEASE_PUBLISH_MESSAGE } from "../constants"
import { mergeResourcesWithOrdering } from "../form-builder/renderers/controls/utils/mergeResourcesWithOrdering"
import { DrawerHeader } from "./DrawerHeader"

interface ChildPageItem {
  id: string
  title: string
  permalink: string
  type: "folder" | "page"
}

interface DraggablePageItemProps {
  page: ChildPageItem
  index: number
  onMoveToTop: () => void
  onMoveToBottom: () => void
  isFirst: boolean
  isLast: boolean
}

const DraggablePageItem = ({
  page,
  index,
  onMoveToTop,
  onMoveToBottom,
  isFirst,
  isLast,
}: DraggablePageItemProps) => {
  const [showActions, setShowActions] = useState(false)

  return (
    <Draggable draggableId={page.id} index={index}>
      {(provided, snapshot) => {
        const isDragging = snapshot.isDragging || snapshot.isDropAnimating
        return (
          <Box
            ref={provided.innerRef}
            {...provided.draggableProps}
            w="100%"
            position="relative"
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
          >
            <HStack
              w="100%"
              borderRadius="6px"
              border="1px solid"
              borderColor={isDragging ? "interaction.main.default" : "base.divider.medium"}
              bg={isDragging ? "interaction.muted.main.hover" : "white"}
              py="0.75rem"
              px="0.75rem"
              gap="0.75rem"
              _hover={{
                bg: "interaction.muted.main.hover",
                borderColor: "interaction.main-subtle.hover",
              }}
            >
              <Box
                {...provided.dragHandleProps}
                display="flex"
                cursor="grab"
                color={isDragging ? "slate.400" : "slate.300"}
                _hover={{ color: "slate.400" }}
              >
                <Icon as={BiGridVertical} fontSize="1.5rem" />
              </Box>

              <Icon
                as={page.type === "folder" ? BiFolder : BiFile}
                fontSize="1rem"
                color="base.content.medium"
              />

              <VStack align="start" gap="0" flex={1} overflow="hidden">
                <Text textStyle="subhead-2" noOfLines={1} wordBreak="break-word">
                  {page.title}
                </Text>
                <Text
                  textStyle="caption-2"
                  color="base.content.medium"
                  noOfLines={1}
                  wordBreak="break-word"
                >
                  {page.permalink}
                </Text>
              </VStack>
            </HStack>

            {showActions && !isDragging && (
              <HStack
                position="absolute"
                right="0.5rem"
                top="50%"
                transform="translateY(-50%)"
                bg="white"
                borderRadius="md"
                boxShadow="sm"
                border="1px solid"
                borderColor="base.divider.medium"
                p="0.25rem"
                gap="0.25rem"
              >
                <Button
                  size="xs"
                  variant="clear"
                  onClick={onMoveToTop}
                  isDisabled={isFirst}
                >
                  Move to top
                </Button>
                <Button
                  size="xs"
                  variant="clear"
                  onClick={onMoveToBottom}
                  isDisabled={isLast}
                >
                  Move to bottom
                </Button>
              </HStack>
            )}
          </Box>
        )
      }}
    </Draggable>
  )
}

interface SiderailOrderingContentProps {
  ordering: string[]
  onOrderingChange: (newOrdering: string[]) => void
}

const SiderailOrderingContent = ({
  ordering,
  onOrderingChange,
}: SiderailOrderingContentProps) => {
  const { pageId, siteId } = useQueryParse(pageSchema)

  const [{ childPages }] = trpc.folder.listChildPages.useSuspenseQuery({
    siteId: String(siteId),
    indexPageId: String(pageId),
  })

  const mappings = useMemo(
    () => new Map(childPages.map(({ title, id }) => [id, title])),
    [childPages],
  )

  const mergedOrdering = useMemo(
    () =>
      mergeResourcesWithOrdering(
        ordering,
        childPages.map(({ id }) => id),
        mappings,
      ),
    [ordering, childPages, mappings],
  )

  const pages: ChildPageItem[] = useMemo(
    () =>
      mergedOrdering.map((resourceId) => ({
        id: resourceId,
        title: mappings.get(resourceId) ?? "Unknown page",
        permalink: `/${resourceId}`,
        type: "page" as const,
      })),
    [mergedOrdering, mappings],
  )

  const handleDragEnd = useCallback(
    ({ source, destination }: DropResult) => {
      if (!destination) return

      const from = source.index
      const to = destination.index

      if (from === to) return
      if (from >= pages.length || to >= pages.length || from < 0 || to < 0)
        return

      const updatedOrdering = Array.from(mergedOrdering)
      const [movedItem] = updatedOrdering.splice(from, 1)

      if (!movedItem) return

      updatedOrdering.splice(to, 0, movedItem)
      onOrderingChange(updatedOrdering)
    },
    [pages.length, mergedOrdering, onOrderingChange],
  )

  const handleMoveToTop = useCallback(
    (index: number) => {
      if (index === 0) return
      const updatedOrdering = Array.from(mergedOrdering)
      const [movedItem] = updatedOrdering.splice(index, 1)
      if (!movedItem) return
      updatedOrdering.unshift(movedItem)
      onOrderingChange(updatedOrdering)
    },
    [mergedOrdering, onOrderingChange],
  )

  const handleMoveToBottom = useCallback(
    (index: number) => {
      if (index === mergedOrdering.length - 1) return
      const updatedOrdering = Array.from(mergedOrdering)
      const [movedItem] = updatedOrdering.splice(index, 1)
      if (!movedItem) return
      updatedOrdering.push(movedItem)
      onOrderingChange(updatedOrdering)
    },
    [mergedOrdering, onOrderingChange],
  )

  if (pages.length === 0) {
    return (
      <Text textStyle="body-2" color="base.content.medium">
        No child pages found in this folder.
      </Text>
    )
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="siderail-pages">
        {(provided) => (
          <VStack
            {...provided.droppableProps}
            ref={provided.innerRef}
            w="100%"
            gap="0.5rem"
          >
            {pages.map((page, index) => (
              <DraggablePageItem
                key={page.id}
                page={page}
                index={index}
                onMoveToTop={() => handleMoveToTop(index)}
                onMoveToBottom={() => handleMoveToBottom(index)}
                isFirst={index === 0}
                isLast={index === pages.length - 1}
              />
            ))}
            {provided.placeholder}
          </VStack>
        )}
      </Droppable>
    </DragDropContext>
  )
}

export default function SiderailOrderingEditorStateDrawer(): JSX.Element {
  const {
    setDrawerState,
    savedPageState,
    setSavedPageState,
    previewPageState,
    setPreviewPageState,
  } = useEditorDrawerContext()

  const { pageId, siteId } = useQueryParse(pageSchema)
  const toast = useToast()
  const utils = trpc.useUtils()

  const { mutate, isPending } = trpc.page.updatePageBlob.useMutation({
    onSuccess: async () => {
      await utils.page.readPageAndBlob.invalidate({ pageId, siteId })
      await utils.page.readPage.invalidate({ pageId, siteId })
      toast({
        status: "success",
        title: CHANGES_SAVED_PLEASE_PUBLISH_MESSAGE,
        ...BRIEF_TOAST_SETTINGS,
      })
    },
  })

  const childrenPagesBlockIndex = useMemo(
    () =>
      previewPageState.content.findIndex(
        (block) => block.type === "childrenpages",
      ),
    [previewPageState.content],
  )

  const childrenPagesBlock = useMemo(() => {
    if (childrenPagesBlockIndex === -1) return null
    return previewPageState.content[childrenPagesBlockIndex] as
      | (IsomerComponent & { type: "childrenpages" })
      | undefined
  }, [previewPageState.content, childrenPagesBlockIndex])

  const currentOrdering = useMemo(
    () => childrenPagesBlock?.childrenPagesOrdering ?? [],
    [childrenPagesBlock],
  )

  const handleOrderingChange = useCallback(
    (newOrdering: string[]) => {
      if (childrenPagesBlockIndex === -1) return

      const updatedContent = [...previewPageState.content]
      const updatedBlock = {
        ...updatedContent[childrenPagesBlockIndex],
        childrenPagesOrdering: newOrdering,
      }
      updatedContent[childrenPagesBlockIndex] = updatedBlock as IsomerComponent

      setPreviewPageState({
        ...previewPageState,
        content: updatedContent,
      })
    },
    [childrenPagesBlockIndex, previewPageState, setPreviewPageState],
  )

  const handleSaveChanges = useCallback(() => {
    setSavedPageState(previewPageState)
    mutate(
      {
        pageId,
        siteId,
        content: JSON.stringify(previewPageState),
      },
      {
        onSuccess: () => setDrawerState({ state: "root" }),
      },
    )
  }, [
    mutate,
    pageId,
    previewPageState,
    setDrawerState,
    setSavedPageState,
    siteId,
  ])

  const handleBack = useCallback(() => {
    setPreviewPageState(savedPageState)
    setDrawerState({ state: "root" })
  }, [savedPageState, setDrawerState, setPreviewPageState])

  const hasChanges = !isEqual(previewPageState, savedPageState)

  return (
    <Flex flexDir="column" position="relative" h="100%" w="100%">
      <DrawerHeader
        isDisabled={isPending}
        onBackClick={handleBack}
        label="Reorder siderail"
      />

      <Box px="1.5rem" py="1rem" flex={1} overflow="auto">
        <VStack align="start" gap="1rem" w="100%">
          <VStack align="start" gap="0.25rem">
            <Text textStyle="body-2" color="base.content.default">
              Drag and drop pages to change how they appear in your siderail.
            </Text>
            <Link
              href="https://guide.isomer.gov.sg/user-guide/index-pages/about-index-pages#what-is-the-siderail"
              isExternal
              textStyle="body-2"
            >
              What's a siderail?
            </Link>
          </VStack>

          {childrenPagesBlockIndex === -1 ? (
            <Text textStyle="body-2" color="base.content.medium">
              This page doesn't have a child pages block configured.
            </Text>
          ) : (
            <Suspense fallback={<Skeleton h="10rem" w="100%" />}>
              <SiderailOrderingContent
                ordering={currentOrdering}
                onOrderingChange={handleOrderingChange}
              />
            </Suspense>
          )}
        </VStack>
      </Box>

      <Box bgColor="base.canvas.default" boxShadow="md" py="1.5rem" px="2rem">
        <Button
          w="100%"
          isLoading={isPending}
          isDisabled={!hasChanges}
          onClick={handleSaveChanges}
        >
          Save changes
        </Button>
      </Box>
    </Flex>
  )
}
