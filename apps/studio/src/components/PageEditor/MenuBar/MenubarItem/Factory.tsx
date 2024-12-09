import type { PossibleMenubarItemProps } from "./types"
import { MenubarDetailedList } from "./DetailedList"
import { MenubarDivider } from "./Divider"
import { MenubarHorizontalList } from "./HorizontalList"
import { MenubarItem } from "./Item"
import { MenubarOverflowList } from "./OverflowList"
import { MenubarVerticalList } from "./VerticalList"

export const MenubarItemFactory = (
  item: PossibleMenubarItemProps,
): React.JSX.Element => {
  switch (item.type) {
    case "divider":
      return <MenubarDivider {...item} />
    case "vertical-list":
      return <MenubarVerticalList {...item} />
    case "horizontal-list":
      return <MenubarHorizontalList {...item} />
    case "detailed-list":
      return <MenubarDetailedList {...item} />
    case "item":
      return <MenubarItem {...item} />
    case "overflow-list":
      return <MenubarOverflowList {...item} />
    default:
      const _: never = item
      return <></>
  }
}
