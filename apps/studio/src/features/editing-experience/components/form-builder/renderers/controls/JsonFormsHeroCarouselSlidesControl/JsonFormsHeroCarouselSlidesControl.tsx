import type { ArrayLayoutProps, RankedTester } from "@jsonforms/core"
import { Box, HStack, Text, VStack } from "@chakra-ui/react"
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd"
import {
  and,
  composePaths,
  isControl,
  rankWith,
  Resolve,
  schemaMatches,
} from "@jsonforms/core"
import { useJsonForms, withJsonFormsArrayLayoutProps } from "@jsonforms/react"
import { HERO_CAROUSEL_SLIDES_FORMAT } from "@opengovsg/isomer-components"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { useEditPageCarouselPreview } from "~/features/editing-experience/components/preview/EditPageCarouselPreviewProvider"
import { TYPE_TO_ICON } from "~/features/editing-experience/constants"

import { AddItemButton } from "../../../components/AddItemButton"
import { DraggableTagButton } from "../../../components/DraggableTagButton"
import { NestedDrawerSwitch } from "../../../components/NestedDrawerSwitch"
import { TagRowActionsMenu } from "../../../components/TagRowActionsMenu"
import { useBuilderErrors } from "../../../ErrorProvider"
import { useArray } from "../../../hooks/useArray"
import { defaultHeroCarouselSlide } from "../../../utils/defaultHeroCarouselSlide"
import {
  indexAfterDelete,
  indexAfterMove,
  slideImageFileName,
  slideRowTitle,
} from "./utils"

export const jsonFormsHeroCarouselSlidesControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.HeroCarouselSlidesControl,
  and(
    isControl,
    schemaMatches((schema) => schema.format === HERO_CAROUSEL_SLIDES_FORMAT),
  ),
)

function JsonFormsHeroCarouselSlidesControl(props: ArrayLayoutProps) {
  const {
    data,
    path,
    addItem,
    arraySchema,
    schema,
    rootSchema,
    uischemas,
    uischema,
    removeItems,
    moveUp,
    moveDown,
    description,
    label,
  } = props
  const { hasErrorAt } = useBuilderErrors()
  const { core } = useJsonForms()
  const preview = useEditPageCarouselPreview()
  const slides = (Resolve.data(core?.data, path) ?? []) as {
    title?: string
    backgroundUrl?: string
  }[]
  const arrayResult = useArray({
    data,
    path,
    arraySchema,
    schema,
    rootSchema,
    uischemas,
    uischema,
    removeItems,
    moveUp,
    moveDown,
  })
  const {
    setSelectedIndex,
    isAddItemDisabled,
    isRemoveItemDisabled,
    onDragEnd,
  } = arrayResult

  const openSlide = (index: number) => {
    setSelectedIndex(index)
    preview?.setActiveIndex(index)
  }

  const setDrawerIndex = (index?: number) => {
    setSelectedIndex(index)
    if (index !== undefined) {
      preview?.setActiveIndex(index)
    }
  }

  const deleteSlide = (index: number) => {
    if (!removeItems || isRemoveItemDisabled) {
      return
    }

    removeItems(path, [index])()
    if (preview) {
      preview.setActiveIndex(
        indexAfterDelete(preview.activeIndex, index, data - 1),
      )
    }
  }

  const handleDrawerRemove = (itemPath: string, index: number) => () => {
    if (!removeItems || isRemoveItemDisabled) {
      return
    }

    removeItems(itemPath, [index])()
    const nextLength = data - 1
    setSelectedIndex(
      nextLength <= 0 ? undefined : indexAfterDelete(index, index, nextLength),
    )
    if (preview) {
      preview.setActiveIndex(
        indexAfterDelete(preview.activeIndex, index, nextLength),
      )
    }
  }

  return (
    <NestedDrawerSwitch
      {...props}
      {...arrayResult}
      setSelectedIndex={setDrawerIndex}
      handleRemoveSelectedItem={handleDrawerRemove}
    >
      <VStack spacing={0} align="start">
        <VStack align="start" spacing="0.25rem" w="full">
          <HStack w="full" justifyContent="space-between" align="center">
            <Text textStyle="subhead-1" flex={1}>
              {label}
            </Text>
            <AddItemButton
              onClick={() => {
                addItem(path, defaultHeroCarouselSlide())()
                const nextIndex = data
                setSelectedIndex(nextIndex)
                preview?.setActiveIndex(nextIndex)
              }}
              isDisabled={isAddItemDisabled}
            >
              Add item
            </AddItemButton>
          </HStack>
          {description && (
            <Text textStyle="body-2" textColor="base.content.default">
              {description}
            </Text>
          )}
        </VStack>
        <Box w="full" mt={description ? "0.75rem" : "0.25rem"}>
          <DragDropContext
            onDragEnd={(result) => {
              if (!result.destination) {
                return
              }

              const from = result.source.index
              const to = result.destination.index
              onDragEnd(result)
              if (preview && from !== to) {
                preview.setActiveIndex(
                  indexAfterMove(preview.activeIndex, from, to),
                )
              }
            }}
          >
            <Droppable droppableId="slides">
              {({ droppableProps, innerRef, placeholder }) => (
                <VStack
                  {...droppableProps}
                  align="baseline"
                  w="100%"
                  h="100%"
                  spacing={0}
                  ref={innerRef}
                >
                  {[...Array(data).keys()].map((index) => {
                    const childPath = composePaths(path, `${index}`)
                    const hasError = hasErrorAt(childPath)
                    const slide = slides[index]
                    const fileName = slideImageFileName(slide?.backgroundUrl)

                    return (
                      <Draggable
                        key={childPath}
                        draggableId={childPath}
                        disableInteractiveElementBlocking
                        index={index}
                      >
                        {({ draggableProps, dragHandleProps, innerRef }) => (
                          <DraggableTagButton.Root
                            draggableProps={draggableProps}
                            isError={hasError}
                            ref={innerRef}
                          >
                            <DraggableTagButton.Handle
                              dragHandleProps={dragHandleProps}
                            />
                            <DraggableTagButton.Body
                              onClick={() => openSlide(index)}
                            >
                              <DraggableTagButton.Icon
                                icon={TYPE_TO_ICON.image}
                              />
                              <DraggableTagButton.Content>
                                <Text textStyle="subhead-2" textAlign="start">
                                  {slideRowTitle(slide?.title, index)}
                                </Text>
                                {hasError ? (
                                  <DraggableTagButton.ErrorCaption />
                                ) : (
                                  fileName && (
                                    <DraggableTagButton.Subtitle>
                                      {fileName}
                                    </DraggableTagButton.Subtitle>
                                  )
                                )}
                              </DraggableTagButton.Content>
                            </DraggableTagButton.Body>
                            <DraggableTagButton.Trailing>
                              <TagRowActionsMenu
                                noun="slide"
                                index={index}
                                isDisabled={isRemoveItemDisabled}
                                onDelete={() => deleteSlide(index)}
                              />
                            </DraggableTagButton.Trailing>
                          </DraggableTagButton.Root>
                        )}
                      </Draggable>
                    )
                  })}

                  {placeholder}
                </VStack>
              )}
            </Droppable>
          </DragDropContext>
        </Box>
      </VStack>
    </NestedDrawerSwitch>
  )
}

export default withJsonFormsArrayLayoutProps(JsonFormsHeroCarouselSlidesControl)
