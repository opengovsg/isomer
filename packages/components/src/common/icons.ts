import type { IconType } from "react-icons"
import {
  BiBarChartAlt2,
  BiBookOpen,
  BiBuildings,
  BiCalendar,
  BiChart,
  BiChat,
  BiFile,
  BiGlobe,
  BiGroup,
  BiHelpCircle,
  BiIdCard,
  BiMapPin,
  BiNews,
  BiPhone,
  BiRightArrowAlt,
  BiStar,
} from "react-icons/bi"

import { BiClipboardCheck } from "./custom-icons/BiClipboardCheck"
import { BiMegaphone } from "./custom-icons/BiMegaphone"

export const SUPPORTED_ICON_NAMES = [
  "right-arrow",
  "bar-chart",
  "line-chart",
  "users",
  "office-building",
  "stars",
  "globe",
  "calendar",
  "book-open",
  "news",
  "file",
  "help-circle",
  "phone",
  "id-card",
  "map-pin",
  "chat",
  "megaphone",
  "clipboard-check",
] as const

export type SupportedIconName = (typeof SUPPORTED_ICON_NAMES)[number]
// TODO: use union types to support more icon libraries apart from react-icons
type SupportedIconType = IconType
export const SUPPORTED_ICONS_MAP: Record<SupportedIconName, SupportedIconType> =
  {
    "right-arrow": BiRightArrowAlt,
    "bar-chart": BiBarChartAlt2,
    "line-chart": BiChart,
    users: BiGroup,
    "office-building": BiBuildings,
    stars: BiStar,
    globe: BiGlobe,
    calendar: BiCalendar,
    "book-open": BiBookOpen,
    news: BiNews,
    file: BiFile,
    "help-circle": BiHelpCircle,
    phone: BiPhone,
    "id-card": BiIdCard,
    "map-pin": BiMapPin,
    chat: BiChat,
    megaphone: BiMegaphone,
    "clipboard-check": BiClipboardCheck,
  }
