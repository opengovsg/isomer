import type { IconType } from "react-icons"
import {
  HStack,
  Icon,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  useDisclosure,
  useOutsideClick,
} from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { useRef } from "react"
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

export const MenubarHorizontalList = ({
  isHidden,
  label,
  defaultIcon,
  items,
}: MenubarHorizontalListProps): JSX.Element | null => {
  const { isOpen, onClose, onOpen } = useDisclosure()
  const contentRef = useRef<HTMLDivElement>(null)
  // closeOnBlur=false pairs with mousedown preventDefault below — otherwise
  // focus stays in the editor and Chakra dismisses the popover immediately.
  // useOutsideClick restores click-outside dismissal without relying on blur.
  useOutsideClick({ ref: contentRef, handler: onClose, enabled: isOpen })

  if (isHidden?.()) {
    return null
  }
  return (
    <Popover
      placement="bottom"
      closeOnBlur={false}
      isLazy
      isOpen={isOpen}
      onClose={onClose}
      onOpen={onOpen}
    >
      <PopoverTrigger>
        <HStack>
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
    </Popover>
  )
}
