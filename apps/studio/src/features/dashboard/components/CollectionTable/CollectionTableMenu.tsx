import { MenuButton, MenuList, Portal } from "@chakra-ui/react"
import { IconButton, Menu } from "@opengovsg/design-system-react"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { useSetAtom } from "jotai"
import { BiCog, BiDotsHorizontalRounded, BiTrash } from "react-icons/bi"

import type { BaseResourceTableData } from "../shared"
import { MenuItem } from "~/components/Menu"
import { deleteResourceModalAtom, pageSettingsModalAtom } from "../../atoms"

interface CollectionTableMenuProps {
  title: BaseResourceTableData["title"]
  resourceId: BaseResourceTableData["id"]
  resourceType: BaseResourceTableData["type"]
}

export const CollectionTableMenu = ({
  title,
  resourceId,
  resourceType,
}: CollectionTableMenuProps) => {
  const setValue = useSetAtom(deleteResourceModalAtom)
  const setPageSettingsModalState = useSetAtom(pageSettingsModalAtom)

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
          {resourceType === ResourceType.CollectionPage && (
            <MenuItem
              icon={<BiCog fontSize="1rem" />}
              onClick={() =>
                setPageSettingsModalState({
                  pageId: resourceId,
                  type: resourceType,
                })
              }
            >
              Edit page settings
            </MenuItem>
          )}
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
