import type { Editor } from "@tiptap/react"
import { Flex, Icon, Portal, VStack } from "@chakra-ui/react"
import { memo } from "react"
import { BiPencil } from "react-icons/bi"

import { TableBubbleMenuActions } from "./TableBubbleMenuActions"
import { useTableBubbleMenu } from "./useTableBubbleMenu"

export interface TableBubbleMenuProps {
  editor: Editor
}

export const TableBubbleMenu = memo(function TableBubbleMenu({
  editor,
}: TableBubbleMenuProps) {
  const {
    show,
    kind,
    isActivated,
    menuRef,
    triggerRef,
    position,
    onMenuFocus,
    onMenuBlur,
    toggleMenu,
  } = useTableBubbleMenu(editor)

  if (!show) {
    return null
  }

  return (
    <Portal>
      <VStack
        ref={menuRef}
        align="flex-end"
        gap="0.25rem"
        data-table-bubble-menu
        // Exempts the portaled trigger/content from Chakra Modal's FocusLock
        // (e.g. Table Settings): react-focus-lock lets focus move freely
        // to/from any element bearing this attribute instead of pulling it
        // back into the modal.
        data-no-focus-lock
        position="fixed"
        left={position ? `${position.x}px` : 0}
        top={position ? `${position.y}px` : 0}
        // Hide until position is computed (async after Portal mount).
        visibility={position ? "visible" : "hidden"}
        zIndex="dropdown"
        onFocus={onMenuFocus}
        onBlur={onMenuBlur}
      >
        {isActivated && (
          <VStack
            align="stretch"
            textAlign="left"
            position="relative"
            zIndex="dropdown"
            data-table-bubble-menu-actions
            bg="base.canvas.default"
            boxShadow="sm"
            borderRadius="0.25rem"
            border="1px solid"
            borderColor="base.divider.medium"
            py="0.5rem"
            gap="0"
            minW="10rem"
          >
            <TableBubbleMenuActions editor={editor} kind={kind} />
          </VStack>
        )}
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
          bg={isActivated ? "interaction.main.default" : "base.canvas.default"}
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
          // Keep editor focus on cell selection; open menu via click instead.
          onMouseDown={(event) => event.preventDefault()}
          onClick={toggleMenu}
        >
          <Icon
            as={BiPencil}
            fontSize="0.75rem"
            color={isActivated ? "white" : "interaction.main.default"}
          />
        </Flex>
      </VStack>
    </Portal>
  )
})
