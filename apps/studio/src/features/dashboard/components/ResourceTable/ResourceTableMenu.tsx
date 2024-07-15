import { MenuButton, MenuList } from "@chakra-ui/react"
import { IconButton, Menu } from "@opengovsg/design-system-react"
import {
  BiCog,
  BiDotsHorizontalRounded,
  BiDuplicate,
  BiFolderOpen,
  BiTrash,
} from "react-icons/bi"

import { MenuItem } from "~/components/Menu"

export const ResourceTableMenu = ({
  resourceId: _resourceId,
}: {
  resourceId: string
}) => {
  return (
    <Menu isLazy size="sm">
      <MenuButton
        aria-label="Options"
        as={IconButton}
        colorScheme="neutral"
        icon={<BiDotsHorizontalRounded />}
        variant="clear"
      />
      <MenuList>
        {/* TODO: Open edit modal depending on resource  */}
        <MenuItem icon={<BiCog fontSize="1rem" />}>Edit page settings</MenuItem>
        <MenuItem icon={<BiDuplicate fontSize="1rem" />}>
          Duplicate page
        </MenuItem>
        <MenuItem icon={<BiFolderOpen fontSize="1rem" />}>Move to...</MenuItem>
        <MenuItem colorScheme="critical" icon={<BiTrash fontSize="1rem" />}>
          Delete
        </MenuItem>
      </MenuList>
    </Menu>
  )
}
