import { IconType } from "react-icons"
import { BiRightArrowAlt } from "react-icons/bi"
import { LiaChartBar } from "react-icons/lia"

export const SUPPORTED_ICON_NAMES = ["right-arrow", "bar-chart"] as const

export type SupportedIconName = (typeof SUPPORTED_ICON_NAMES)[number]
// TODO: use union types to support more icon libraries apart from react-icons
export type SupportedIconType = IconType
export const SUPPORTED_ICONS_MAP: Record<SupportedIconName, SupportedIconType> =
  {
    "right-arrow": BiRightArrowAlt,
    "bar-chart": LiaChartBar,
  }
