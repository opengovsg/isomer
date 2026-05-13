import { MenuButton, MenuList, Portal } from "@chakra-ui/react"
import { IconButton, Menu } from "@opengovsg/design-system-react"
import { useSetAtom } from "jotai"
import {
  BiCog,
  BiDotsHorizontalRounded,
  BiFolderOpen,
  BiTrash,
} from "react-icons/bi"
import { MenuItem } from "~/components/Menu"
import { moveResourceAtom } from "~/features/editing-experience/atoms"
import { ResourceType } from "~prisma/generated/generatedEnums"

import type { CollectionTableData } from "./types"
import { deleteResourceModalAtom, pageSettingsModalAtom } from "../../atoms"

interface CollectionTableMenuProps {
  title: CollectionTableData["title"]
  parentId: CollectionTableData["parentId"]
  permalink: CollectionTableData["permalink"]
  resourceId: CollectionTableData["id"]
  resourceType: CollectionTableData["type"]
}

const SearchPageMenuItems = () => {
  return (
    <>
      <MenuItem
        isDisabled
        icon={<BiCog fontSize="1rem" />}
        tooltip="This is a default page and its settings cannot be edited."
      >
        Edit settings
      </MenuItem>
      <MenuItem
        isDisabled
        icon={<BiFolderOpen fontSize="1rem" />}
        tooltip="This is a default page that cannot be moved."
      >
        Move to...
      </MenuItem>
      <MenuItem
        isDisabled
        colorScheme="critical"
        icon={<BiTrash fontSize="1rem" />}
        tooltip="This is a default page that cannot be removed."
      >
        Delete
      </MenuItem>
    </>
  )
}

export const CollectionTableMenu = ({
  title,
  resourceId,
  resourceType,
  parentId,
  permalink,
}: CollectionTableMenuProps) => {
  const setValue = useSetAtom(deleteResourceModalAtom)
  const setPageSettingsModalState = useSetAtom(pageSettingsModalAtom)
  const setMoveResource = useSetAtom(moveResourceAtom)
  const handleMoveResourceClick = () => {
    setMoveResource({
      id: resourceId,
      title,
      permalink,
      parentId,
      type: resourceType,
    })
  }
  const isSearchPage = permalink === "search" && parentId === null

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
          {isSearchPage ? (
            <SearchPageMenuItems />
          ) : (
            <>
              {(resourceType === ResourceType.CollectionPage ||
                resourceType === ResourceType.CollectionLink) && (
                <MenuItem
                  icon={<BiCog fontSize="1rem" />}
                  onClick={() =>
                    setPageSettingsModalState({
                      pageId: resourceId,
                      type: resourceType,
                    })
                  }
                >
                  Edit settings
                </MenuItem>
              )}
              <MenuItem
                as="button"
                icon={<BiFolderOpen fontSize="1rem" />}
                onClick={handleMoveResourceClick}
              >
                Move to...
              </MenuItem>
              {resourceType !== ResourceType.IndexPage && (
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
              )}
            </>
          )}
        </MenuList>
      </Portal>
    </Menu>
  )
}
