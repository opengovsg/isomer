import type { IsomerComponent } from "@opengovsg/isomer-components"
import { chakra, Flex, Icon, SimpleGrid, Stack, Text } from "@chakra-ui/react"
import { BLOCK_TO_META } from "~/components/PageEditor/constants"
import { TYPE_TO_ICON } from "~/features/editing-experience/constants"

type NestedBlockType = IsomerComponent["type"]

interface NestedBlockPickerProps {
  allowedTypes: NestedBlockType[]
  onSelect: (type: NestedBlockType) => void
}

/**
 * In-place picker for adding a block inside a container block (an Accordion
 * or a Column). Unlike the page-level ComponentSelector it does not take over
 * the drawer, so the user keeps the parent form in view.
 */
export const NestedBlockPicker = ({
  allowedTypes,
  onSelect,
}: NestedBlockPickerProps) => {
  return (
    <Stack
      gap="0.75rem"
      p="0.75rem"
      border="1px dashed"
      borderColor="interaction.main-subtle.hover"
      borderRadius="6px"
      bg="base.canvas.brand-subtle"
      w="full"
    >
      <Text textStyle="caption-1" color="base.content.medium">
        Choose a block to add
      </Text>
      <SimpleGrid columns={2} spacing="0.5rem">
        {allowedTypes.map((type) => {
          const { label, description } = BLOCK_TO_META[type]
          // A container inside a container gets the full width and a hint,
          // since it is a different kind of choice from the content blocks.
          const isContainer = type === "column"

          return (
            <chakra.button
              key={type}
              type="button"
              layerStyle="focusRing"
              display="flex"
              alignItems="center"
              gap="0.75rem"
              px="0.75rem"
              py="0.625rem"
              border="1px solid"
              borderColor="base.divider.medium"
              borderRadius="6px"
              bg="white"
              textAlign="start"
              transitionProperty="common"
              transitionDuration="normal"
              _hover={{
                bg: "interaction.muted.main.hover",
                borderColor: "interaction.main-subtle.hover",
              }}
              gridColumn={isContainer ? "1 / -1" : undefined}
              onClick={() => onSelect(type)}
            >
              <Flex
                p="0.5rem"
                bg="interaction.main-subtle.default"
                borderRadius="full"
                flexShrink={0}
              >
                <Icon
                  as={TYPE_TO_ICON[type]}
                  fontSize="1rem"
                  color="base.content.default"
                  aria-hidden
                />
              </Flex>
              <Stack gap="0.125rem" minW={0}>
                <Text textStyle="caption-1">{label}</Text>
                {isContainer && (
                  <Text textStyle="caption-2" color="base.content.medium">
                    {description}
                  </Text>
                )}
              </Stack>
            </chakra.button>
          )
        })}
      </SimpleGrid>
    </Stack>
  )
}
