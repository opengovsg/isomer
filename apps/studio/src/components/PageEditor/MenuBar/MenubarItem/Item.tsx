import type { MenuItemProps } from "../../MenuItem"
import { MenuItem } from "../../MenuItem"

export interface MenubarItemProps extends MenuItemProps {
  type: "item"
  isHidden?: () => boolean
}

export const MenubarItem = ({
  isHidden,
  ...item
}: MenubarItemProps): JSX.Element | null => {
  if (isHidden?.()) {
    return null
  }
  return <MenuItem {...item} />
}
