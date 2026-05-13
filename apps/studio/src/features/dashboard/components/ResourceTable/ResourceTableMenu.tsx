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
import { Can } from "~/features/permissions"
import { ResourceType } from "~prisma/generated/generatedEnums"

import type { ResourceTableData } from "./types"
import {
  deleteResourceModalAtom,
  folderSettingsModalAtom,
  pageSettingsModalAtom,
} from "../../atoms"

interface ResourceTableMenuProps {
  title: ResourceTableData["title"]
  resourceId: ResourceTableData["id"]
  type: ResourceTableData["type"]
  permalink: ResourceTableData["permalink"]
  resourceType: ResourceTableData["type"]
  parentId: ResourceTableData["parentId"]
}

const SearchPageMenu = ({ title }: { title: string }) => {
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
        <MenuList minWidth="8rem">
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
        </MenuList>
      </Portal>
    </Menu>
  )
}

export const ResourceTableMenu = ({
  resourceId,
  title,
  type,
  permalink,
  resourceType,
  parentId,
}: ResourceTableMenuProps) => {
  const setMoveResource = useSetAtom(moveResourceAtom)
  const handleMoveResourceClick = () =>
    setMoveResource({ id: resourceId, title, permalink, parentId, type })
  const setResourceModalState = useSetAtom(deleteResourceModalAtom)
  const setFolderSettingsModalState = useSetAtom(folderSettingsModalAtom)
  const setPageSettingsModalState = useSetAtom(pageSettingsModalAtom)
  const isSearchPage = permalink === "search" && parentId === null

  if (isSearchPage) {
    return <SearchPageMenu title={title} />
  }

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
        <MenuList minWidth="8rem">
          {/* TODO: Open edit modal depending on resource  */}
          {type === ResourceType.Page && (
            <MenuItem
              onClick={() =>
                setPageSettingsModalState({
                  pageId: resourceId,
                  type,
                })
              }
              icon={<BiCog fontSize="1rem" />}
            >
              Edit settings
            </MenuItem>
          )}
          {type === ResourceType.Folder && (
            <MenuItem
              onClick={() =>
                setFolderSettingsModalState({
                  folderId: resourceId,
                })
              }
              icon={<BiCog fontSize="1rem" />}
            >
              Edit folder settings
            </MenuItem>
          )}
          {(type === ResourceType.Page || type === ResourceType.Folder) && (
            // TODO: we need to change the resourceid next time when we implement root level permissions
            <Can do="move" on={{ parentId }}>
              <MenuItem
                as="button"
                onClick={handleMoveResourceClick}
                icon={<BiFolderOpen fontSize="1rem" />}
                aria-label={`Move resource to another location for ${title}`}
              >
                Move to...
              </MenuItem>
            </Can>
          )}
          {resourceType !== ResourceType.RootPage && (
            <Can do="delete" on={{ parentId }}>
              <MenuItem
                onClick={() => {
                  setResourceModalState({
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
            </Can>
          )}
        </MenuList>
      </Portal>
    </Menu>
  )
}
