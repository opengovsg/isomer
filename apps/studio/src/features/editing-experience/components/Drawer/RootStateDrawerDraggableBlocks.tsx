import type { DropResult } from "@hello-pangea/dnd"
import type { IsomerSchema } from "@opengovsg/isomer-components"
import { Box, Button, Flex, Icon, Text, VStack } from "@chakra-ui/react"
import { DragDropContext, Droppable } from "@hello-pangea/dnd"
import { Infobox } from "@opengovsg/design-system-react"
import {
  ISOMER_PAGE_LAYOUTS,
  ISOMER_USABLE_PAGE_LAYOUTS,
} from "@opengovsg/isomer-components"
import { BiCog, BiPlus, BiPlusCircle } from "react-icons/bi"
import { Disable } from "~/components/Disable"
import { BlockEditingPlaceholder } from "~/components/Svg"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { useSelectBlock } from "~/features/editing-experience/hooks/useSelectBlock"

import { getIsHeroFirstBlock } from "../../utils/getIsHeroFirstBlock"
import { DraggableBlock } from "../Block/DraggableBlock"
import {
  FixedBlock,
  invalidBlockDescription,
} from "./RootStateDrawerFixedBlock"

interface RootStateDrawerAlertsProps {
  isCustomContentIndexPage: boolean
  scheduledAt: Date | null
  isPreviewingIndexPage: boolean
  onPreviewConversionToIndexPage: () => void
}

export const RootStateDrawerAlerts = ({
  isCustomContentIndexPage,
  scheduledAt,
  isPreviewingIndexPage,
  onPreviewConversionToIndexPage,
}: RootStateDrawerAlertsProps) => 
  (
    <>
      {isCustomContentIndexPage && (
        <Infobox
          width="100%"
          size="sm"
          border="1px solid"
          borderColor="utility.feedback.info"
          borderRadius="0.25rem"
        >
          <VStack spacing="0.75rem" alignItems="start">
            <VStack spacing="0.25rem" alignItems="start">
              <Text textStyle="body-2">
                You’re using a custom layout for this page.
              </Text>
              <Text textStyle="body-2">
                You can choose to use the new index page layout, but you will
                lose all custom content you’ve added.
              </Text>
            </VStack>

            <Button
              textStyle="body-2"
              variant="link"
              fontSize="0.875rem"
              onClick={onPreviewConversionToIndexPage}
            >
              Preview what this looks like
            </Button>
          </VStack>
        </Infobox>
      )}
      {!!scheduledAt && (
        <Infobox
          size="sm"
          border="1px solid"
          borderColor="utility.feedback.info"
          borderRadius="0.25rem"
        >
          <Text textStyle="body-2">
            This page is scheduled for publishing. To make changes, cancel the
            schedule first.
          </Text>
        </Infobox>
      )}
      {isPreviewingIndexPage && (
        <Infobox
          size="sm"
          border="1px solid"
          borderColor="utility.feedback.info"
          borderRadius="0.25rem"
          w="full"
        >
          <Text textStyle="body-2">
            You’re previewing what you’ll see once you accept the change.
          </Text>
        </Infobox>
      )}
    </>
  )


interface RootStateDrawerBlocksSectionProps {
  disableBlocks: boolean
  onDragEnd: (result: DropResult) => void
  isPreviewingIndexPage: boolean
  savedPageState: IsomerSchema
  invalidBlockIndexes: Set<number>
}

export const RootStateDrawerBlocksSection = ({
  disableBlocks,
  onDragEnd,
  isPreviewingIndexPage,
  savedPageState,
  invalidBlockIndexes,
}: RootStateDrawerBlocksSectionProps) => {
  const { setDrawerState, previewPageState } = useEditorDrawerContext()
  const selectBlock = useSelectBlock()
  const pageLayout = previewPageState.layout
  // NOTE: because we migrate from github -> studio
  // and also becuase our underlying is just json,
  // it's not guaranteed that our `rootpage` will always
  // have a hero banner
  const isHeroFixedBlock = getIsHeroFirstBlock(pageLayout, savedPageState)
  // Collection and system-managed Search pages do not render custom content.
  const canAddBlocks =
    pageLayout !== ISOMER_USABLE_PAGE_LAYOUTS.Collection &&
    pageLayout !== ISOMER_PAGE_LAYOUTS.Search

  return (
    <Disable when={disableBlocks}>
      <VStack gap="1.5rem" flex={1} w="full">
        {/* Fixed Blocks Section */}
        <VStack gap="1rem" w="100%" align="start">
          <VStack gap="0.25rem" align="start">
            <Text textStyle="subhead-1">Fixed blocks</Text>
            <Text textStyle="caption-2" color="base.content.medium">
              These are built into the layout, so you can&apos;t delete them.
            </Text>
          </VStack>

          <FixedBlock />
        </VStack>

        {pageLayout === "index" && (
          <Button
            // NOTE: Top offset is only `1rem` but the `gap` on parent component is `1.5rem`
            marginTop="-0.5rem"
            variant="link"
            gap="0.25rem"
            cursor="pointer"
            alignSelf="flex-start"
            onClick={() =>{  setDrawerState({ state: "siderailOrderingEditor" }); }}
          >
            <Icon
              as={BiCog}
              color="interaction.main.default"
              boxSize="1.25rem"
            />
            <Text textStyle="subhead-2" color="interaction.links.default">
              Reorder siderail for this folder
            </Text>
          </Button>
        )}

        {/* Custom Blocks Section */}
        <VStack gap="1.5rem" w="100%">
          <VStack w="100%" h="100%" gap="1rem">
            <Flex flexDirection="row" w="100%">
              {canAddBlocks && (
                <VStack gap="0.25rem" align="start" flex={1}>
                  <Text textStyle="subhead-1">Custom blocks</Text>
                  <Text textStyle="caption-2" color="base.content.medium">
                    Use blocks to display your content.
                  </Text>
                </VStack>
              )}
              {/* TODO: we should swap over to using the `resource.type` */}
              {/* rather than the `page.layout` but we are unable to do so due */}
              {/* to the existence of custom index page that are `layout: */}
              {/* content` but have `resource.type: index` */}
              {canAddBlocks && (
                <Button
                  size="xs"
                  flexShrink={0}
                  leftIcon={<BiPlusCircle fontSize="1.25rem" />}
                  variant="clear"
                  onClick={() =>{  setDrawerState({ state: "addBlock" }); }}
                >
                  Add block
                </Button>
              )}
            </Flex>
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="blocks">
                {(provided) => (
                  <VStack
                    {...provided.droppableProps}
                    w="100%"
                    ref={provided.innerRef}
                  >
                    <Box w="100%">
                      {!isPreviewingIndexPage &&
                        ((isHeroFixedBlock &&
                          savedPageState.content.length === 1) ||
                          (savedPageState.content.length === 0 &&
                            canAddBlocks)) && (
                          <>
                            <VStack
                              justifyContent="center"
                              spacing={0}
                              mt="2.75rem"
                              mb="1.5rem"
                            >
                              <BlockEditingPlaceholder />
                              <Text
                                mt="0.75rem"
                                textStyle="subhead-1"
                                color="base.content.default"
                              >
                                Blocks you add will appear here
                              </Text>
                              <Text
                                mt="0.25rem"
                                textStyle="caption-2"
                                color="base.content.medium"
                              >
                                Click the ‘Add block’ button above to add blocks
                                to this page
                              </Text>
                            </VStack>

                            <Button
                              variant="outline"
                              w="100%"
                              onClick={() =>{ 
                                setDrawerState({ state: "addBlock" }); }
                              }
                              leftIcon={<Icon as={BiPlus} fontSize="1.25rem" />}
                            >
                              Add a new block
                            </Button>
                          </>
                        )}

                      <Flex flexDirection="column" mt="-0.25rem">
                        {previewPageState.content.map((block, index) => {
                          if (isHeroFixedBlock && index === 0) {
                            return null
                          }

                          // Check if block is a hidden childrenpages block
                          const isHiddenChildrenPages =
                            block.type === "childrenpages" &&
                            "isHidden" in block &&
                            block.isHidden

                          return (
                            <DraggableBlock
                              block={block}
                              // TODO: Generate a block ID instead of index
                              // oxlint-disable-next-line react-doctor/no-array-index-as-key -- blocks lack stable ids; draggableId still uses index per @dnd-kit.
                              key={`${block.type}-${index}`}
                              // TODO: Use block ID when instead of index for uniquely identifying blocks
                              draggableId={`${block.type}-${index}`}
                              index={index}
                              onClick={() => {
                                // TODO: we should automatically do this probably?
                                const nextState =
                                  savedPageState.content[index]?.type ===
                                  "prose"
                                    ? "nativeEditor"
                                    : "complexEditor"
                                // NOTE: SNAPSHOT
                                selectBlock(index, {
                                  state: nextState,
                                })
                              }}
                              invalidProps={
                                invalidBlockIndexes.has(index)
                                  ? {
                                      description: invalidBlockDescription,
                                    }
                                  : undefined
                              }
                              isHidden={isHiddenChildrenPages}
                            />
                          )
                        })}
                      </Flex>
                    </Box>
                    {provided.placeholder}
                  </VStack>
                )}
              </Droppable>
            </DragDropContext>
          </VStack>
        </VStack>
      </VStack>
    </Disable>
  )
}

interface RootStateDrawerPreviewFooterProps {
  isSavingPage: boolean
  onConfirmConvertIndexPageModalOpen: () => void
  onCancelConversionToIndexPage: () => void
}

export const RootStateDrawerPreviewFooter = ({
  isSavingPage,
  onConfirmConvertIndexPageModalOpen,
  onCancelConversionToIndexPage,
}: RootStateDrawerPreviewFooterProps) => 
  (
    <Box
      bgColor="base.canvas.default"
      boxShadow="md"
      py="1.5rem"
      px="2rem"
      mt="auto"
    >
      <VStack spacing="1.25rem">
        <Infobox width="100%" size="sm" variant="warning">
          <Text textStyle="body-2">
            All custom content that was previously on this page will be lost
            once you press ‘Accept this change’.
          </Text>
        </Infobox>

        <VStack gap="1rem" w="full">
          <Button
            w="100%"
            isLoading={isSavingPage}
            onClick={onConfirmConvertIndexPageModalOpen}
          >
            Accept this change
          </Button>

          <Button
            w="100%"
            variant="outline"
            onClick={onCancelConversionToIndexPage}
          >
            Keep old version
          </Button>
        </VStack>
      </VStack>
    </Box>
  )

