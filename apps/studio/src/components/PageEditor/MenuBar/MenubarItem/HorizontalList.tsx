import type { IconType } from "react-icons"
import {
  HStack,
  Icon,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
} from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { useEffect, useRef } from "react"
import { BiChevronDown, BiChevronUp } from "react-icons/bi"

import type { MenubarNestedItem } from "./types"
import { MenuItem } from "../../MenuItem"

export interface MenubarHorizontalListProps {
  type: "horizontal-list"
  label: string
  defaultIcon: IconType
  items: MenubarNestedItem[]
  isHidden?: () => boolean
}

// Split out of MenubarHorizontalList so the outside-click effect below can
// live in a real component instead of Popover's render-prop callback (hooks
// can't run inside a plain callback).
const HorizontalListPopoverContent = ({
  isOpen,
  onClose,
  label,
  defaultIcon,
  items,
}: {
  isOpen: boolean
  onClose: () => void
  label: string
  defaultIcon: IconType
  items: MenubarNestedItem[]
}) => {
  const triggerRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        triggerRef.current?.contains(target) ||
        contentRef.current?.contains(target)
      ) {
        return
      }
      onClose()
    }
    document.addEventListener("mousedown", handlePointerDown)
    return () => document.removeEventListener("mousedown", handlePointerDown)
  }, [isOpen, onClose])

  return (
    <>
      <PopoverTrigger>
        <HStack ref={triggerRef}>
          <Button
            variant="clear"
            colorScheme="neutral"
            px={0}
            aria-label={label}
            h="1.75rem"
            minH="1.75rem"
            isActive={isOpen}
            _active={{
              bg: "interaction.muted.main.active",
            }}
            // TipTap toolbar pattern: keep editor selection on open.
            onMouseDown={(event) => event.preventDefault()}
          >
            <HStack spacing={0}>
              <Icon
                as={defaultIcon}
                fontSize="1.25rem"
                color="base.content.medium"
              />
              <Icon
                as={isOpen ? BiChevronUp : BiChevronDown}
                fontSize="1.25rem"
                color="base.content.medium"
              />
            </HStack>
          </Button>
        </HStack>
      </PopoverTrigger>
      <PopoverContent ref={contentRef} w="fit-content">
        <PopoverBody>
          <HStack>
            {items.map((subItem, index) => (
              <MenuItem
                key={index}
                icon={subItem.icon}
                title={subItem.title}
                action={() => {
                  subItem.action()
                  onClose()
                }}
                isActive={subItem.isActive}
              />
            ))}
          </HStack>
        </PopoverBody>
      </PopoverContent>
    </>
  )
}

export const MenubarHorizontalList = ({
  isHidden,
  label,
  defaultIcon,
  items,
}: MenubarHorizontalListProps): JSX.Element | null => {
  if (isHidden?.()) {
    return null
  }
  return (
    // closeOnBlur=false pairs with mousedown preventDefault below — otherwise
    // focus stays in the editor and Chakra dismisses the popover immediately.
    // That also disables Chakra's own outside-click handling (it's gated on
    // closeOnBlur too); HorizontalListPopoverContent reimplements just that
    // part.
    <Popover placement="bottom" closeOnBlur={false} isLazy>
      {({ isOpen, onClose }) => (
        <HorizontalListPopoverContent
          isOpen={isOpen}
          onClose={onClose}
          label={label}
          defaultIcon={defaultIcon}
          items={items}
        />
      )}
    </Popover>
  )
}
