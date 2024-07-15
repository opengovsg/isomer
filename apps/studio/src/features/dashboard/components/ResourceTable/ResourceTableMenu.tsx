import { MenuButton, MenuItem, MenuList } from "@chakra-ui/react"
import { IconButton, Menu } from "@opengovsg/design-system-react"
import { BiDotsHorizontalRounded, BiEdit } from "react-icons/bi"

export const ResourceTableMenu = ({
  resourceId: _resourceId,
}: {
  resourceId: string
}) => {
  return (
    <Menu isLazy>
      <MenuButton
        aria-label="Options"
        as={IconButton}
        colorScheme="neutral"
        icon={<BiDotsHorizontalRounded />}
        variant="clear"
      />
      <MenuList>
        {/* TODO: Open edit modal depending on resource  */}
        <MenuItem icon={<BiEdit />}>Edit</MenuItem>
      </MenuList>
    </Menu>
  )
}
