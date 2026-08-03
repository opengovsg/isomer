import { Flex, Icon, Text, useDisclosure } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { BiPencil } from "react-icons/bi"
import { TableSettingsModal } from "~/features/editing-experience/components/TableSettingsModal/TableSettingsModal"

import { getDisplayTableCaption, isPlaceholderTableCaption } from "./utils"

export interface TableCaptionProps {
  caption: string
  onCaptionChange: (caption: string) => void
}

/**
 * Read-only caption line for a single table with a right-aligned control that
 * opens the table settings modal — "Add caption" for placeholder defaults,
 * "Edit" when a real caption exists.
 *
 * Rendered by `TableNodeView`, so the caption it shows and the caption it
 * writes back always belong to the same `table` node — no document positions
 * to track, even when a document contains several tables.
 */
export const TableCaption = ({
  caption,
  onCaptionChange,
}: TableCaptionProps) => {
  const {
    isOpen: isTableSettingsModalOpen,
    onOpen: onTableSettingsModalOpen,
    onClose: onTableSettingsModalClose,
  } = useDisclosure()

  const hasCaption = !isPlaceholderTableCaption(caption)
  const displayCaption = getDisplayTableCaption(caption)

  return (
    <>
      <Flex align="center" justify="space-between" gap="0.25rem" w="100%">
        <Text
          flex="1"
          minW={0}
          textStyle="caption-2"
          color={hasCaption ? "base.content.default" : "base.content.medium"}
          whiteSpace="normal"
          wordBreak="break-word"
        >
          {displayCaption}
        </Text>
        <Button
          variant="clear"
          size="xs"
          leftIcon={
            <Icon
              as={BiPencil}
              color="interaction.links.default"
              boxSize="1rem"
            />
          }
          color="interaction.links.default"
          textStyle="caption-1"
          padding="0.5rem"
          flexShrink={0}
          onClick={onTableSettingsModalOpen}
          aria-label={hasCaption ? "Edit table caption" : "Add table caption"}
        >
          {hasCaption ? "Edit" : "Add caption"}
        </Button>
      </Flex>

      {/* Mounted only while open so the form always initialises from the
          caption as it stands when the author opens the modal. */}
      {isTableSettingsModalOpen && (
        <TableSettingsModal
          caption={caption}
          isOpen
          onClose={onTableSettingsModalClose}
          onSave={onCaptionChange}
        />
      )}
    </>
  )
}
