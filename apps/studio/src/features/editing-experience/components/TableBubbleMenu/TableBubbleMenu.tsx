import type { Editor } from "@tiptap/react"
import {
  Flex,
  Icon,
  Popover,
  PopoverAnchor,
  PopoverBody,
  PopoverContent,
} from "@chakra-ui/react"
import { BubbleMenu } from "@tiptap/react/menus"
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
    kind,
    isActivated,
    triggerRef,
    popoverContentRef,
    toggleMenu,
    deactivateMenu,
    shouldShow,
    getReferencedVirtualElement,
    bubbleMenuOptions,
    appendTo,
    pluginKey,
  } = useTableBubbleMenu(editor)

  return (
    <BubbleMenu
      editor={editor}
      pluginKey={pluginKey}
      updateDelay={0}
      resizeDelay={0}
      shouldShow={shouldShow}
      getReferencedVirtualElement={getReferencedVirtualElement}
      appendTo={appendTo}
      options={bubbleMenuOptions}
      data-table-bubble-menu
      data-no-focus-lock
      style={{ zIndex: "var(--chakra-zIndices-dropdown, 1400)" }}
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
              <TableBubbleMenuActions editor={editor} kind={kind} />
            </PopoverBody>
          </PopoverContent>
        ) : null}
      </Popover>
    </BubbleMenu>
  )
})
