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
  if (isHidden?.()) {
    return null
  }
  return (
    <Popover placement="bottom" closeOnBlur={false} isLazy>
      {({ isOpen, onClose }) => (
        <>
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
                // Keep the editor selection when opening the list menu —
                // otherwise mousedown steals focus from TipTap.
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
          <PopoverContent w="fit-content">
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
      )}
    </Popover>
  )
}
