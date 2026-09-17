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
import { useIsUnpublishEnabled } from "~/hooks/useIsUnpublishEnabled"
import { ResourceType } from "~prisma/generated/generatedEnums"

import type { CollectionTableData } from "./types"
import { deleteResourceModalAtom, pageSettingsModalAtom } from "../../atoms"

interface CollectionTableMenuProps {
  title: CollectionTableData["title"]
  parentId: CollectionTableData["parentId"]
  permalink: CollectionTableData["permalink"]
  resourceId: CollectionTableData["id"]
  resourceType: CollectionTableData["type"]
  liveStatus: CollectionTableData["liveStatus"]
  scheduledAt: CollectionTableData["scheduledAt"]
}

export const CollectionTableMenu = ({
  title,
  resourceId,
  resourceType,
  parentId,
  permalink,
  liveStatus,
  scheduledAt,
}: CollectionTableMenuProps) => {
  const setValue = useSetAtom(deleteResourceModalAtom)
  const setPageSettingsModalState = useSetAtom(pageSettingsModalAtom)
  const setMoveResource = useSetAtom(moveResourceAtom)
  const isUnpublishEnabled = useIsUnpublishEnabled()
  const handleMoveResourceClick = () => {
    setMoveResource({
      id: resourceId,
      title,
      permalink,
      parentId,
      type: resourceType,
    })
  }

  // With unpublishing disabled, the server treats deletion as the only way
  // to remove live content, so live status alone must not block it here —
  // only a pending schedule does (the server always guards against that).
  const isBlockedByLiveStatus = isUnpublishEnabled && liveStatus !== "notLive"
  const isBlockedBySchedule = scheduledAt !== null
  const isDeleteBlocked = isBlockedByLiveStatus || isBlockedBySchedule
  const deleteBlockedReason = isBlockedBySchedule
    ? "This page has a pending schedule — cancel it before deleting"
    : isBlockedByLiveStatus
      ? "Unpublish this page before deleting it"
      : undefined

  return (
    <Menu isLazy size="sm">
      <MenuButton
        aria-label={`Options for ${title}`}
        as={IconButton}
        colorScheme="neutral"
        icon={<BiDotsHorizontalRounded />}
        variant="clear"
        position="relative"
        zIndex={1}
      />
      <Portal>
        <MenuList>
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
              isDisabled={isDeleteBlocked}
              tooltip={deleteBlockedReason}
            >
              Delete
            </MenuItem>
          )}
        </MenuList>
      </Portal>
    </Menu>
  )
}
