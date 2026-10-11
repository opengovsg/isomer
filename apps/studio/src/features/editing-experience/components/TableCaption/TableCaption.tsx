import { Flex, Icon, Text, useDisclosure } from "@chakra-ui/react"
import {
  Button,
  IconButton,
  TouchableTooltip,
} from "@opengovsg/design-system-react"
import { BiPencil, BiRevision } from "react-icons/bi"
import { TableSettingsModal } from "~/features/editing-experience/components/TableSettingsModal/TableSettingsModal"

import { isPlaceholderTableCaption } from "./utils"

const RESET_COLUMN_WIDTH_LABEL = "Reset column width"

export interface TableCaptionProps {
  caption: string
  onCaptionChange: (caption: string) => void
  /** Present only after column widths have been edited. */
  onResetColumnWidths?: () => void
}

export const TableCaption = ({
  caption,
  onCaptionChange,
  onResetColumnWidths,
}: TableCaptionProps) => {
  const {
    isOpen: isTableSettingsModalOpen,
    onOpen: onTableSettingsModalOpen,
    onClose: onTableSettingsModalClose,
  } = useDisclosure()

  const hasCaption = !isPlaceholderTableCaption(caption)

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
          {caption}
        </Text>
        <Flex align="center" gap="0.5rem" flexShrink={0}>
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
            {hasCaption ? "Edit caption" : "Add caption"}
          </Button>
          {onResetColumnWidths && (
            <TouchableTooltip label={RESET_COLUMN_WIDTH_LABEL}>
              <IconButton
                aria-label={RESET_COLUMN_WIDTH_LABEL}
                variant="clear"
                size="xs"
                color="interaction.links.default"
                fontSize="1rem"
                icon={<BiRevision />}
                minW="unset"
                h="auto"
                p="0.5rem"
                onClick={onResetColumnWidths}
              />
            </TouchableTooltip>
          )}
        </Flex>
      </Flex>

      {/* Unmount while closed so defaultValues match the caption at open time. */}
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
