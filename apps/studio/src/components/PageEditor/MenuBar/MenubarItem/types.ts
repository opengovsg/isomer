import type { IconType } from "react-icons"

import type { MenubarDetailedListProps } from "./DetailedList"
import type { MenubarDividerProps } from "./Divider"
import type { MenubarHorizontalListProps } from "./HorizontalList"
import type { MenubarItemProps } from "./Item"
import type { MenubarOverflowListProps } from "./OverflowList"
import type { MenubarVerticalListProps } from "./VerticalList"

export interface MenubarNestedItem {
  type: "item"
  title: string
  description?: string
  icon?: IconType
  useSecondaryColor?: boolean
  leftItem?: JSX.Element
  action: () => void
  isActive?: () => boolean
  isHidden?: () => boolean
}

export type PossibleMenubarItemProps =
  | MenubarDividerProps
  | MenubarVerticalListProps
  | MenubarHorizontalListProps
  | MenubarDetailedListProps
  | MenubarItemProps
  | MenubarOverflowListProps
