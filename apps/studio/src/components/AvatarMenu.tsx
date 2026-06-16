import type { GrowthbookAttributes } from "~/types/growthbook"
import { useGrowthBook } from "@growthbook/growthbook-react"
import {
  Avatar,
  Button,
  Menu,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
} from "@opengovsg/oui"
import { useSetAtom } from "jotai"
import { useEffect } from "react"
import { BiChevronDown, BiLogOut, BiPencil, BiUser } from "react-icons/bi"
import { useMe } from "~/features/me/api"
import { updateProfileModalOpenAtom } from "~/features/users/atoms"
import { EditProfileModal } from "~/features/users/components"

export const AvatarMenu = () => {
  const { me, logout } = useMe()
  const gb = useGrowthBook()

  const setIsEditProfileModalOpen = useSetAtom(updateProfileModalOpenAtom)

  useEffect(() => {
    const newAttributes: Partial<GrowthbookAttributes> = {
      email: me.email,
    }

    void gb.setAttributes(newAttributes)
  }, [gb, me])

  return (
    <>
      <MenuTrigger>
        <Button
          variant="clear"
          color="neutral"
          className="min-w-0 gap-1.5 px-0"
          endContent={
            <BiChevronDown className="size-5 transition-transform group-aria-expanded:rotate-180" />
          }
        >
          <Avatar size="md" prominence="subtle" name={me.name}>
            <Avatar.Fallback />
          </Avatar>
        </Button>
        <Menu classNames={{ popover: "max-w-[19rem]" }}>
          <MenuItem isDisabled startContent={<BiUser className="size-5" />}>
            {me.email}
          </MenuItem>
          <MenuSeparator />
          <MenuItem
            onAction={() => setIsEditProfileModalOpen(true)}
            startContent={<BiPencil className="size-5" />}
          >
            Edit profile
          </MenuItem>
          <MenuItem
            onAction={() => logout()}
            startContent={<BiLogOut className="size-5" />}
          >
            Sign out
          </MenuItem>
        </Menu>
      </MenuTrigger>
      <EditProfileModal />
    </>
  )
}
