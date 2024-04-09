import { IconType } from "react-icons"
import { BiRightArrowAlt } from "react-icons/bi"
import { LiaChartBar } from "react-icons/lia"
import { RxCross2 } from "react-icons/rx"

export const SUPPORTED_ICON_NAMES = [
  "right-arrow",
  "bar-chart",
  "cross",
] as const

export type SupportedIconName = (typeof SUPPORTED_ICON_NAMES)[number]
// TODO: use union types to support more icon libraries apart from react-icons
export type SupportedIconType = IconType
export const SUPPORTED_ICONS_MAP: Record<SupportedIconName, SupportedIconType> =
  {
    "right-arrow": BiRightArrowAlt,
    "bar-chart": LiaChartBar,
    cross: RxCross2,
  }
