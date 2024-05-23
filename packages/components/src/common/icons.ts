import { IconType } from "react-icons"
import {
  BiRightArrowAlt,
  BiBuildings,
  BiChart,
  BiGlobe,
  BiGroup,
  BiStar,
  BiBarChartAlt2,
} from "react-icons/bi"

export const SUPPORTED_ICON_NAMES = [
  "right-arrow",
  "bar-chart",
  "line-chart",
  "users",
  "office-building",
  "stars",
  "globe",
] as const

export type SupportedIconName = (typeof SUPPORTED_ICON_NAMES)[number]
// TODO: use union types to support more icon libraries apart from react-icons
export type SupportedIconType = IconType
export const SUPPORTED_ICONS_MAP: Record<SupportedIconName, SupportedIconType> =
  {
    "right-arrow": BiRightArrowAlt,
    "bar-chart": BiBarChartAlt2,
    "line-chart": BiChart,
    users: BiGroup,
    "office-building": BiBuildings,
    stars: BiStar,
    globe: BiGlobe,
  }
