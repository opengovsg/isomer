import { useMemo } from "react"
import NextLink from "next/link"
import { MenuButton, MenuList, Portal } from "@chakra-ui/react"
import { IconButton, Menu } from "@opengovsg/design-system-react"
import { useSetAtom } from "jotai"
import { BiCog, BiDotsHorizontalRounded, BiTrash } from "react-icons/bi"

import type { CollectionTableData } from "./types"
import { MenuItem } from "~/components/Menu"
import { getLinkToResource } from "~/utils/resource"
import { deleteResourceModalAtom } from "../../atoms"

interface CollectionTableMenuProps {
  title: CollectionTableData["title"]
  resourceId: CollectionTableData["id"]
  resourceType: CollectionTableData["type"]
  siteId: number
}

export const CollectionTableMenu = ({
  siteId,
  title,
  resourceId,
  resourceType,
}: CollectionTableMenuProps) => {
  const setValue = useSetAtom(deleteResourceModalAtom)

  const linkToResourceSettings = useMemo(
    () =>
      `${getLinkToResource({ siteId, resourceId, type: resourceType })}/settings`,
    [siteId, resourceId, resourceType],
  )

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
          <MenuItem
            icon={<BiCog fontSize="1rem" />}
            as={NextLink}
            // @ts-expect-error type inconsistency with `as`
            href={linkToResourceSettings}
          >
            Edit page settings
          </MenuItem>
          <MenuItem
            onClick={() => {
              setValue({
                title,
                resourceId,
                resourceType,
              })
            }}
            colorScheme="critical"
            icon={<BiTrash fontSize="1rem" />}
          >
            Delete
          </MenuItem>
        </MenuList>
      </Portal>
    </Menu>
  )
}
