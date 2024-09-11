import type { IsomerSchema } from "@opengovsg/isomer-components"
import { useMemo } from "react"
import { chakra, Flex, HStack, Icon, Text, VStack } from "@chakra-ui/react"
import { Draggable } from "@hello-pangea/dnd"
import { getComponentSchema } from "@opengovsg/isomer-components"
import { BiGridVertical } from "react-icons/bi"

import { PROSE_COMPONENT_NAME } from "~/constants/formBuilder"
import { TYPE_TO_ICON } from "../../constants"

interface DraggableBlockProps {
  block: IsomerSchema["content"][number]
  draggableId: string
  index: number
  onClick: () => void
}

export const DraggableBlock = ({
  block,
  draggableId,
  index,
  onClick,
}: DraggableBlockProps): JSX.Element => {
  const icon = TYPE_TO_ICON[block.type]

  const label = useMemo(() => {
    // NOTE: Because we use `Type.Ref` for prose,
    // this gets a `$Ref` only and not the concrete values
    return block.type === "prose"
      ? PROSE_COMPONENT_NAME
      : getComponentSchema(block.type).title
  }, [block.type])

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
            <HStack
              onClick={onClick}
              as="button"
              layerStyle="focusRing"
              w="100%"
              borderRadius="6px"
              border="1px solid"
              borderColor={
                isDragging
                  ? "interaction.main-subtle.hover"
                  : "base.divider.medium"
              }
              transitionProperty="common"
              transitionDuration="normal"
              _hover={{
                bg: "interaction.muted.main.hover",
                borderColor: "interaction.main-subtle.hover",
              }}
              bg={isDragging ? "interaction.muted.main.hover" : "white"}
              py="0.5rem"
              px="0.75rem"
              flexDirection="row"
              align="center"
            >
              <chakra.button
                display="flex"
                tabIndex={0}
                {...provided.dragHandleProps}
                layerStyle="focusRing"
                borderRadius="4px"
                transition="color 0.2s ease"
                _hover={{
                  color: "slate.400",
                }}
                color={isDragging ? "slate.400" : "slate.300"}
              >
                <Icon as={BiGridVertical} fontSize="1.5rem" />
              </chakra.button>

              {icon && (
                <Flex
                  p="0.25rem"
                  bg="interaction.main-subtle.default"
                  borderRadius="4px"
                >
                  <Icon
                    as={icon}
                    fontSize="0.75rem"
                    color="base.content.default"
                  />
                </Flex>
              )}
              <Text textStyle="subhead-2">{label}</Text>
            </HStack>
          </VStack>
        )
      }}
    </Draggable>
  )
}
