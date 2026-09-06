import type { IconType } from "react-icons"
import {
  BiBarChartAlt2,
  BiBuildings,
  BiChart,
  BiGlobe,
  BiGroup,
  BiRightArrowAlt,
  BiStar,
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
// NOTE: use union types to support more icon libraries apart from react-icons
type SupportedIconType = IconType
export const SUPPORTED_ICONS_MAP = {
  "bar-chart": BiBarChartAlt2,
  globe: BiGlobe,
  "line-chart": BiChart,
  "office-building": BiBuildings,
  "right-arrow": BiRightArrowAlt,
  stars: BiStar,
  users: BiGroup,
} as const satisfies Record<SupportedIconName, SupportedIconType>
