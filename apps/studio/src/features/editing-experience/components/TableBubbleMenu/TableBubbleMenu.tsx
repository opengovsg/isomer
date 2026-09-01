import type { Editor } from "@tiptap/react"
import {
  Box,
  Flex,
  Icon,
  Popover,
  PopoverAnchor,
  PopoverBody,
  PopoverContent,
  Portal,
} from "@chakra-ui/react"
import { memo } from "react"
import { BiPencil } from "react-icons/bi"

import { TableBubbleMenuActions } from "./TableBubbleMenuActions"
import { useTableBubbleMenu } from "./useTableBubbleMenu"

/** Matches packages/components default when site theme is unavailable. */
export const DEFAULT_BRAND_CANVAS_INVERSE_COLOR = "#00405f"

export interface TableBubbleMenuProps {
  editor: Editor
  brandCanvasInverseColor?: string
  isDragReordering?: boolean
}

export const TableBubbleMenu = memo(function TableBubbleMenu({
  editor,
  brandCanvasInverseColor = DEFAULT_BRAND_CANVAS_INVERSE_COLOR,
  isDragReordering = false,
}: TableBubbleMenuProps) {
  const {
    show,
    kind,
    isActivated,
    menuRef,
    triggerRef,
    popoverContentRef,
    position,
    onMenuFocus,
    onMenuBlur,
    toggleMenu,
    deactivateMenu,
  } = useTableBubbleMenu(editor, { isDragReordering })

  if (!show) {
    return null
  }

  return (
    <Portal>
      <Box
        ref={menuRef}
        data-table-bubble-menu
        // Lets focus move between this portaled menu and Chakra modals (e.g. Table Settings).
        data-no-focus-lock
        position="fixed"
        left={position ? `${position.x}px` : 0}
        top={position ? `${position.y}px` : 0}
        visibility={position ? "visible" : "hidden"}
        zIndex="dropdown"
        onFocus={onMenuFocus}
        onBlur={onMenuBlur}
      >
        <Popover
          isOpen={isActivated}
          onClose={deactivateMenu}
          placement="top-end"
          strategy="fixed"
          gutter={4}
          flip
          autoFocus={false}
          returnFocusOnClose={false}
          closeOnBlur={false}
        >
          <PopoverAnchor>
            <Flex
              ref={triggerRef}
              as="button"
              type="button"
              aria-label="Table actions"
              aria-pressed={isActivated}
              data-table-bubble-menu-trigger
              p="0.5rem"
              borderRadius="full"
              cursor="pointer"
              bg={
                isActivated ? "interaction.main.default" : "base.canvas.default"
              }
              boxShadow="0 0 10px 0 rgba(191, 191, 191, 0.50)"
              transition="background-color 0.15s, box-shadow 0.15s, filter 0.15s"
              sx={{
                _hover: {
                  boxShadow: "0 0 12px 0 rgba(191, 191, 191, 0.65)",
                  ...(isActivated
                    ? { filter: "brightness(0.92)" }
                    : { bg: "interaction.main-subtle.default" }),
                },
              }}
              onMouseDown={(event) => event.preventDefault()}
              onClick={toggleMenu}
            >
              <Icon
                as={BiPencil}
                fontSize="0.75rem"
                color={isActivated ? "white" : "interaction.main.default"}
              />
            </Flex>
          </PopoverAnchor>
          {isActivated ? (
            <PopoverContent
              ref={popoverContentRef}
              data-table-bubble-menu-actions
              data-no-focus-lock
              w="auto"
              minW="10rem"
              p="0"
              py="0.5rem"
              bg="base.canvas.default"
              boxShadow="sm"
              borderRadius="0.25rem"
              border="1px solid"
              borderColor="base.divider.medium"
              _focus={{ boxShadow: "sm" }}
            >
              <PopoverBody p="0">
                <TableBubbleMenuActions
                  editor={editor}
                  kind={kind}
                  brandCanvasInverseColor={brandCanvasInverseColor}
                  onColorSet={deactivateMenu}
                />
              </PopoverBody>
            </PopoverContent>
          ) : null}
        </Popover>
      </Box>
    </Portal>
  )
})
