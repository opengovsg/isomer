import type { ControlProps, RankedTester } from "@jsonforms/core"
import { Box, FormControl, Skeleton, VStack } from "@chakra-ui/react"
import {
  DragDropContext,
  Draggable,
  Droppable,
  DropResult,
} from "@hello-pangea/dnd"
import { rankWith, schemaMatches } from "@jsonforms/core"
import { withJsonFormsControlProps } from "@jsonforms/react"
import { FormLabel } from "@opengovsg/design-system-react"

import Suspense from "~/components/Suspense"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { editPageSchema } from "~/features/editing-experience/schema"
import { useQueryParse } from "~/hooks/useQueryParse"
import { trpc } from "~/utils/trpc"
import { BaseBlock, BaseBlockDragHandle } from "../../../Block/BaseBlock"
import { merge } from "./utils/merge"

export const jsonFormsChildrenPagesOrderingControlTester: RankedTester =
  rankWith(
    JSON_FORMS_RANKING.ChildrenPagesOrderingControl,
    schemaMatches((schema) => schema.format === "childrenPagesOrdering"),
  )

type ReorderingControlProps<T = string> = Omit<ControlProps, "data"> & {
  data: T[]
}

const DraggableBlocks = ({
  data,
  handleChange,
  path,
}: ReorderingControlProps<{ title: string; id: string }>) => {
  const onDragEnd = ({ source, destination }: DropResult) => {
    if (!destination) return

    const from = source.index
    const to = destination.index

    if (from >= data.length || to >= data.length || from < 0 || to < 0) return

    const updatedBlocks = Array.from(data)
    const [movedBlock] = updatedBlocks.splice(from, 1)

    if (!movedBlock) return

    updatedBlocks.splice(to, 0, movedBlock)

    handleChange(
      path,
      updatedBlocks.map(({ id }) => id),
    )
  }

  return (
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
              {data.map((resource, index) => (
                <Draggable
                  key={resource.id}
                  disableInteractiveElementBlocking
                  draggableId={resource.id}
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
                            <BaseBlockDragHandle isDragging={isDragging} />
                          }
                          label={resource.title}
                          draggableProps={provided.dragHandleProps}
                        />
                      </VStack>
                    )
                  }}
                </Draggable>
              ))}

              {provided.placeholder}
            </VStack>
          )
        }}
      </Droppable>
    </DragDropContext>
  )
}

const SuspendableBlocks = ({
  data,
  siteId,
  indexPageId,
  ...rest
}: ReorderingControlProps & { siteId: string; indexPageId: string }) => {
  const [{ childPages }] = trpc.folder.listChildPages.useSuspenseQuery({
    siteId: String(siteId),
    indexPageId: String(indexPageId),
  })

  const mappings = new Map(childPages.map(({ title, id }) => [id, title]))
  const resources = merge(
    data,
    childPages.map(({ id }) => id),
    mappings,
  ).map((resourceId) => {
    return {
      title: mappings.get(resourceId) ?? "Unknown page",
      id: resourceId,
    }
  })

  return <DraggableBlocks data={resources} {...rest} />
}

export function JsonFormsChildrenPagesLayoutControl({
  data,
  label,
  description,
  ...rest
}: ReorderingControlProps): JSX.Element {
  const { pageId: indexPageId, siteId } = useQueryParse(editPageSchema)

  return (
    <Box h="full">
      <FormControl isRequired gap="0.5rem">
        <FormLabel mb="1rem" description={description}>
          {label || "Variant"}
        </FormLabel>
        <Suspense fallback={<Skeleton h="2rem" w="100%" />}>
          <SuspendableBlocks
            indexPageId={String(indexPageId)}
            siteId={String(siteId)}
            data={data}
            label={label}
            description={description}
            {...rest}
          />
        </Suspense>
      </FormControl>
    </Box>
  )
}

export default withJsonFormsControlProps(JsonFormsChildrenPagesLayoutControl)
