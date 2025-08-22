import type {
  IsomerComponent,
  IsomerSchema,
} from "@opengovsg/isomer-components"
import { useCallback, useMemo } from "react"
import { VStack } from "@chakra-ui/react"
import { Draggable } from "@hello-pangea/dnd"
import {
  getComponentSchema,
  renderComponentPreviewText,
} from "@opengovsg/isomer-components"

import { PROSE_COMPONENT_NAME } from "~/constants/formBuilder"
import { ajv } from "~/utils/ajv"
import { TYPE_TO_ICON } from "../../constants"
import { BaseBlock, BaseBlockDragHandle } from "./BaseBlock"

interface DraggableBlockProps {
  block: IsomerSchema["content"][number]
  layout: IsomerSchema["layout"]
  draggableId: string
  index: number
  onClick: () => void
}

export const DraggableBlock = ({
  block,
  layout,
  draggableId,
  index,
  onClick,
}: DraggableBlockProps): JSX.Element => {
  const icon = TYPE_TO_ICON[block.type]

  const blockComponentName = useMemo(() => {
    // NOTE: Because we use `Type.Ref` for prose,
    // this gets a `$Ref` only and not the concrete values
    return block.type === "prose"
      ? PROSE_COMPONENT_NAME
      : (getComponentSchema({ component: block.type }).title ?? "Unknown")
  }, [block.type])

  const previewText: string = renderComponentPreviewText({
    component: block,
  })

  const validateFn = useCallback(() => {
    const subSchema = getComponentSchema({
      component: block.type,
      layout,
    })
    return ajv.compile<IsomerComponent>(subSchema)
  }, [block, layout])

  const isInvalid = useMemo(() => {
    const isValid = validateFn()(block)
    return !isValid
  }, [block, validateFn])

  return (
    <Draggable
      disableInteractiveElementBlocking
      draggableId={draggableId}
      index={index}
    >
      {(provided, snapshot) => {
        const isDragging = snapshot.isDragging || snapshot.isDropAnimating
        return (
          // TODO: Add image per block, extra menu for block
          // according to design
          <VStack
            my="0.25rem"
            w="100%"
            ref={provided.innerRef}
            {...provided.draggableProps}
          >
            <BaseBlock
              onClick={onClick}
              dragHandle={
                <BaseBlockDragHandle
                  isDragging={isDragging}
                  {...provided.dragHandleProps}
                />
              }
              label={
                previewText === ""
                  ? `Empty ${blockComponentName.toLowerCase()}`
                  : previewText
              }
              description={blockComponentName}
              icon={icon}
              isInvalid={isInvalid}
            />
          </VStack>
        )
      }}
    </Draggable>
  )
}
