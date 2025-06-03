import type { ControlProps, RankedTester } from "@jsonforms/core"
import { Box, FormControl, VStack } from "@chakra-ui/react"
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "@hello-pangea/dnd"
import { rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { FormLabel } from "@opengovsg/design-system-react"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { editPageSchema } from "~/features/editing-experience/schema"
import { useQueryParse } from "~/hooks/useQueryParse"
import { trpc } from "~/utils/trpc"
import { BaseBlock, BaseBlockDragHandle } from "../../../Block/BaseBlock"

export const jsonFormsChildrenPagesOrderingControlTester: RankedTester =
  rankWith(
    JSON_FORMS_RANKING.ChildrenPagesOrderingControl,
    schemaMatches((schema) => schema.format === "childrenPagesOrdering"),
  )

export function JsonFormsChildrenPagesLayoutControl({
  data,
  label,
  description,
  handleChange,
  path,
}: Omit<ControlProps, "data"> & { data: string[] }): JSX.Element {
  const { pageId: indexPageId, siteId } = useQueryParse(editPageSchema)

  const [{ childPages }] = trpc.folder.listChildPages.useSuspenseQuery({
    siteId: String(siteId),
    indexPageId: String(indexPageId),
  })

  const onDragEnd = ({ source, destination }: DropResult) => {
    if (!destination) return

    const from = source.index
    const to = destination.index

    if (from >= data.length || to >= data.length || from < 0 || to < 0) return

    const updatedBlocks = Array.from(data)
    const [movedBlock] = updatedBlocks.splice(from, 1)

    if (!movedBlock) return

    updatedBlocks.splice(to, 0, movedBlock)

    handleChange(path, updatedBlocks)
  }

  return (
    <Box h="full">
      <FormControl isRequired gap="0.5rem">
        <FormLabel mb="1rem" description={description}>
          {label || "Variant"}
        </FormLabel>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="blocks">
            {(provided) => {
              return (
                <VStack
                  spacing="0.75rem"
                  {...provided.droppableProps}
                  w="100%"
                  ref={provided.innerRef}
                  h="full"
                >
                  {data.map((resourceId: string, index) => {
                    return (
                      <Draggable
                        key={resourceId}
                        disableInteractiveElementBlocking
                        draggableId={resourceId}
                        index={index}
                      >
                        {(provided, snapshot) => {
                          const isDragging =
                            snapshot.isDragging || snapshot.isDropAnimating
                          return (
                            <VStack
                              my="0.25rem"
                              w="100%"
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                            >
                              <BaseBlock
                                dragHandle={
                                  <BaseBlockDragHandle
                                    isDragging={isDragging}
                                    {...provided.dragHandleProps}
                                  />
                                }
                                label={
                                  childPages.find(({ id }) => id === resourceId)
                                    ?.title ?? ""
                                }
                              />
                            </VStack>
                          )
                        }}
                      </Draggable>
                    )
                  })}
                  {provided.placeholder}
                </VStack>
              )
            }}
          </Droppable>
        </DragDropContext>
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsChildrenPagesLayoutControl)
