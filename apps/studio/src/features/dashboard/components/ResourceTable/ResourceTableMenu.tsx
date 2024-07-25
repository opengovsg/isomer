import { MenuButton, MenuList, Portal } from "@chakra-ui/react"
import { IconButton, Menu } from "@opengovsg/design-system-react"
import {
  BiCog,
  BiDotsHorizontalRounded,
  BiDuplicate,
  BiFolderOpen,
  BiTrash,
} from "react-icons/bi"

import type { ResourceTableData } from "./types"
import { MenuItem } from "~/components/Menu"

interface ResourceTableMenuProps {
  title: ResourceTableData["title"]
  resourceId: ResourceTableData["id"]
  type: ResourceTableData["type"]
}

export const ResourceTableMenu = ({ title, type }: ResourceTableMenuProps) => {
  return (
    <Menu isLazy size="sm">
      <MenuButton
        aria-label={`Options for ${title}`}
        as={IconButton}
        colorScheme="neutral"
        icon={<BiDotsHorizontalRounded />}
        variant="clear"
      />
      <Portal>
        <MenuList>
          {/* TODO: Open edit modal depending on resource  */}
          {type === "Page" ? (
            <>
              <MenuItem icon={<BiCog fontSize="1rem" />}>
                Edit page settings
              </MenuItem>
              <MenuItem icon={<BiDuplicate fontSize="1rem" />}>
                Duplicate page
              </MenuItem>
            </>
          ) : (
            <MenuItem icon={<BiCog fontSize="1rem" />}>
              Edit folder settings
            </MenuItem>
          )}
          <MenuItem icon={<BiFolderOpen fontSize="1rem" />}>
            Move to...
          </MenuItem>
          <MenuItem colorScheme="critical" icon={<BiTrash fontSize="1rem" />}>
            Delete
          </MenuItem>
        </MenuList>
      </Portal>
    </Menu>
  )
}
