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
  }

// Human-readable labels shown in the Studio icon picker
export const SUPPORTED_ICON_LABELS: Record<SupportedIconName, string> = {
  "right-arrow": "Right arrow",
  "bar-chart": "Bar chart",
  "line-chart": "Line chart",
  users: "Users",
  "office-building": "Office building",
  stars: "Stars",
  globe: "Globe",
  calendar: "Calendar",
  "book-open": "Education/training",
  news: "News",
  file: "Documents/file",
  "help-circle": "Help/FAQ",
  phone: "Contact/phone",
  "id-card": "ID card",
  "map-pin": "Location pin",
  chat: "Contact/support",
}
