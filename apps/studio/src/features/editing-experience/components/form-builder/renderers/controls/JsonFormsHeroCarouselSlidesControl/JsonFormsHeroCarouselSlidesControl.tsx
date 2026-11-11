import type { ArrayLayoutProps, RankedTester } from "@jsonforms/core"
import { Text } from "@chakra-ui/react"
import {
  and,
  isControl,
  rankWith,
  Resolve,
  schemaMatches,
} from "@jsonforms/core"
import { useJsonForms, withJsonFormsArrayLayoutProps } from "@jsonforms/react"
import {
  defaultHeroCarouselSlide,
  HERO_CAROUSEL_SLIDES_FORMAT,
} from "@opengovsg/isomer-components"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { useEditPageCarouselPreview } from "~/features/editing-experience/components/preview/EditPageCarouselPreviewProvider"
import { TYPE_TO_ICON } from "~/features/editing-experience/constants"

import { DraggableArrayList } from "../../../components/DraggableArrayList"
import { DraggableTagButton } from "../../../components/DraggableTagButton"
import { NestedDrawerSwitch } from "../../../components/NestedDrawerSwitch"
import { TagRowActionsMenu } from "../../../components/TagRowActionsMenu"
import { useArray } from "../../../hooks/useArray"
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

// Slides list that keeps the preview carousel on the slide being edited.
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
  const { setSelectedIndex, isAddItemDisabled, isRemoveItemDisabled } =
    arrayResult

  const selectSlide = (index?: number) => {
    setSelectedIndex(index)
    if (index !== undefined) {
      preview?.setActiveIndex(index)
    }
  }

  const removeSlide = (index: number) => {
    if (!removeItems || isRemoveItemDisabled) {
      return false
    }

    removeItems(path, [index])()
    preview?.setActiveIndex(
      indexAfterDelete(preview.activeIndex, index, data - 1),
    )
    return true
  }

  // Stay in the drawer on the neighbouring slide instead of closing it.
  const handleDrawerRemove = (_itemPath: string, index: number) => () => {
    if (!removeSlide(index)) {
      return
    }
    const nextLength = data - 1
    setSelectedIndex(
      nextLength <= 0 ? undefined : indexAfterDelete(index, index, nextLength),
    )
  }

  return (
    <NestedDrawerSwitch
      {...props}
      {...arrayResult}
      setSelectedIndex={selectSlide}
      handleRemoveSelectedItem={handleDrawerRemove}
    >
      <DraggableArrayList
        label={label}
        description={description}
        path={path}
        count={data}
        isAddDisabled={isAddItemDisabled}
        onAdd={() => {
          addItem(path, defaultHeroCarouselSlide())()
          selectSlide(data)
        }}
        onDragEnd={(result) => {
          arrayResult.onDragEnd(result)
          if (preview && result.destination) {
            preview.setActiveIndex(
              indexAfterMove(
                preview.activeIndex,
                result.source.index,
                result.destination.index,
              ),
            )
          }
        }}
        renderRow={(index, { hasError, dragHandleProps }) => {
          const slide = slides[index]
          const fileName = slideImageFileName(slide?.backgroundUrl)

          return (
            <>
              <DraggableTagButton.Handle dragHandleProps={dragHandleProps} />
              <DraggableTagButton.Body onClick={() => selectSlide(index)}>
                <DraggableTagButton.Icon icon={TYPE_TO_ICON.image} />
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
                  onDelete={() => removeSlide(index)}
                />
              </DraggableTagButton.Trailing>
            </>
          )
        }}
      />
    </NestedDrawerSwitch>
  )
}

export default withJsonFormsArrayLayoutProps(JsonFormsHeroCarouselSlidesControl)
