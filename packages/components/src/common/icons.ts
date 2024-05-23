import { IconType } from "react-icons"
import { BiRightArrowAlt } from "react-icons/bi"
import { LiaChartBar } from "react-icons/lia"
import {
  HiOutlineDocumentReport,
  HiOutlinePresentationChartLine,
  HiOutlineUsers,
  HiOutlineOfficeBuilding,
  HiOutlineSparkles,
  HiOutlineGlobeAlt,
} from "react-icons/hi"

export const SUPPORTED_ICON_NAMES = [
  "right-arrow",
  "bar-chart",
  "doc-report",
  "line-chart",
  "users",
  "office-building",
  "sparkles",
  "globe",
] as const

export type SupportedIconName = (typeof SUPPORTED_ICON_NAMES)[number]
// TODO: use union types to support more icon libraries apart from react-icons
export type SupportedIconType = IconType
export const SUPPORTED_ICONS_MAP: Record<SupportedIconName, SupportedIconType> =
  {
    "right-arrow": BiRightArrowAlt,
    "bar-chart": LiaChartBar,
    "doc-report": HiOutlineDocumentReport,
    "line-chart": HiOutlinePresentationChartLine,
    users: HiOutlineUsers,
    "office-building": HiOutlineOfficeBuilding,
    sparkles: HiOutlineSparkles,
    globe: HiOutlineGlobeAlt,
  }
